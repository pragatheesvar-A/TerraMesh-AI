class HysteresisFilter:
    """
    Prevents alarm flapping (rapid toggling) by requiring a signal to
    drop significantly below the threshold before clearing the alarm.
    """
    def __init__(self, deadband=0.1):
        self.deadband = deadband # E.g. 10%
        self.active_alarms = {}
        
    def evaluate(self, sensor_id: str, value: float, threshold: float, is_high_alarm=True) -> bool:
        if is_high_alarm:
            if value > threshold:
                self.active_alarms[sensor_id] = True
                return True
            elif value < threshold * (1 - self.deadband):
                self.active_alarms[sensor_id] = False
                return False
        else:
            if value < threshold:
                self.active_alarms[sensor_id] = True
                return True
            elif value > threshold * (1 + self.deadband):
                self.active_alarms[sensor_id] = False
                return False
                
        # If in the deadband, keep previous state
        return self.active_alarms.get(sensor_id, False)
