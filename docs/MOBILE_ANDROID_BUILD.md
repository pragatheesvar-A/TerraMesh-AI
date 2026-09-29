# TerraMesh AI — Mobile Android Build (NDK Investigation & Evidence)

Date: 2026-09-25

## Toolchain Identified

| Component | Version / Value |
|---|---|
| Android Gradle Plugin | (Expo SDK 57 defaults, AGP via `com.android.tools.build:gradle`) |
| Gradle | 9.3.1 (wrapper; user cache `9.3.1/transforms` observed) |
| compileSdk | rootProject.ext.compileSdkVersion (Expo 57 → 36) |
| targetSdk | Expo 57 → 36 |
| NDK | 27.1.12297006 |
| CMake | 3.22.1 (SDK-bundled, `android/sdk/cmake/3.22.1`) |
| JDK | Gradle-managed JDK (Gradle 9.3.1 toolchain) |
| NDK path used by Gradle (before fix) | `C:\Users\NFS Photographer\AppData\Local\Android\Sdk\ndk\27.1.12297006` |
| NDK path used by Gradle (after fix)  | `C:\NDK27` (junction → same NDK 27.1.12297006) |

## Symptom

`gradlew assembleDebug` failed in
`:app:buildCMakeDebug[arm64-v8a]` (and previously in
`:expo-modules-core:buildCMakeDebug`) with massive `ld.lld` undefined-symbol
errors for the entire C++ runtime:

```
ld.lld: error: undefined symbol: operator new(unsigned long)
ld.lld: error: undefined symbol: __cxa_guard_acquire
ld.lld: error: undefined symbol: std::__ndk1::basic_string<...>::~basic_string()
ld.lld: error: undefined symbol: __cxa_begin_catch / __cxa_throw / vtable for __cxxabiv1...
```

The generated `build.ninja` link rules contained **no `-lc++` /
`libc++_shared.so`** input — the C++ runtime library reference was being
dropped from the link line.

## Root Cause Diagnosis

Evidence chain:

1. The NDK lived under a path containing a space:
   `C:\Users\NFS Photographer\...`
2. AGP invokes the linker via `cmd.exe /C "..."` (visible in
   `.cxx/.../CMakeFiles/rules.ninja`). The CMake-generated command quotes the
   `--sysroot="C:/Users/NFS Photographer/..."` argument.
3. cmd.exe strips the inner quotes at the first space; the toolchain path to
   the STL library (`libc++.a` / `libc++_shared.so` linker script or the
   `-lc++_shared` flag expansion involving the spaced path) is lost, so the
   C++ runtime never reaches the linker.
4. Reproduced outside Gradle: invoking the NDK's `clang++.exe` through
   `cmd.exe` with a quoted spaced sysroot reproduces the argument mangling
   (`error: no such file or directory: 'Photographer/AppData/...'`), while
   the same invocation with a space-free path links successfully and emits a
   `NEEDED libc++_shared.so` ELF dependency.
5. The STL libraries themselves are intact (`libc++_shared.so` verified as a
   valid ELF in the NDK sysroot) — this is **not** a broken NDK install.

## Fix (Environment, Not Source)

1. Created a space-free junction to the same NDK:
   ```
   mklink /J C:\NDK27 "C:\Users\NFS Photographer\AppData\Local\Android\Sdk\ndk\27.1.12297006"
   ```
2. `mobile/android/gradle.properties`:
   ```
   ndkPath=C\:/NDK27
   ```
3. `mobile/android/app/build.gradle` — propagated the property into the
   `android {}` block (root `ndkPath` property alone was not honored by AGP
   for the app module's externalNativeBuild):
   ```gradle
   if (rootProject.hasProperty('ndkPath')) {
       ndkPath rootProject.ext.ndkPath
   }
   ```
4. Cleaned `.cxx` + CMake intermediates and rebuilt.

## Verification

- Post-fix CMake metadata confirms the intended NDK:
  `-DANDROID_NDK=C:\NDK27` (in `app/.cxx/.../metadata_generation_command.txt`).
- Clean build: **BUILD SUCCESSFUL** (`assembleDebug`, ~6 min full, 11 s incremental).
- APK exists (see below).

## Build Artifact

| Field | Value |
|---|---|
| Type | APK (debug, signed with debug key) |
| Path | `mobile/android/app/build/outputs/apk/debug/app-debug.apk` |
| Size | 180,120,529 bytes (~171.8 MB) |
| Built | 2026-09-25 22:48 local |
| Version | versionCode 1, versionName 1.0 (from `app/build.gradle`) |

## iOS

Not attempted — Windows environment. Building iOS requires macOS/Xcode.
Status: **BLOCKED — macOS/Xcode required.**

## Note on Permanence

The `gradle.properties`/`build.gradle` change is guarded by
`hasProperty('ndkPath')`: on machines without the property (or without a
spaced-NDK problem) the build uses the default SDK-resolved NDK, so the
change is a no-op elsewhere.
