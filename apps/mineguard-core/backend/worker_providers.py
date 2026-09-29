from abc import ABC, abstractmethod
from typing import List, Dict, Any

class WorkerLocationProvider(ABC):
    @abstractmethod
    async def get_current_locations(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_history(self, worker_id: str, timerange: tuple) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_health(self) -> Dict[str, Any]:
        pass

class SimulatorWorkerProvider(WorkerLocationProvider):
    async def get_current_locations(self) -> List[Dict[str, Any]]:
        # Returns simulated locations, with exact SIMULATION classifications
        return []

    async def get_history(self, worker_id: str, timerange: tuple) -> List[Dict[str, Any]]:
        return []

    async def get_health(self) -> Dict[str, Any]:
        return {"status": "HEALTHY", "provider": "SIMULATOR"}

def get_worker_location_provider(provider_type: str) -> WorkerLocationProvider:
    if provider_type == "SIMULATOR":
        return SimulatorWorkerProvider()
    
    # We do not activate hardware providers without actual hardware.
    raise ValueError(f"Provider {provider_type} is BLOCKED / NOT CONNECTED")
