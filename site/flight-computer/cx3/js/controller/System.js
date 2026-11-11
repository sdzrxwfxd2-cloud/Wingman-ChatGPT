// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
//#include "System.h"
//#include "string.h"
//#include "time.h"

// uncomment to run factory test
// comment out for normal testing
//#define _FACTORY_TEST

// Names of battery status.
CONST.BATTERY_STATUS = {
    DEAD: 0,
    DANGERZONE: 1,
    _25PERCENT: 2,
    _50PERCENT: 3,
    _75PERCENT: 4,
    FULL: 5,
    LENGTH: 6
};

CONST.SCROLL_BAR_SPEED = {
    SLOW: 12,
    MEDIUM: 10,
    FAST: 8
};

CONST.SCROLL_BAR_FUNCTION = {
    BOTH: 0,
    SCROLL: 1,
    TAP: 2
};

CONST.BACKLIGHT_VALUE = {
    OFF: 0,
    LOW: 2,
    MEDIUM: 5,
    MEDIUM_HIGH: 7,
    HIGH: 10
};

function Time() {
    this.hours = 12;
    this.minutes = 0;
    this.seconds = 0;
};

CONST.CX3_DATA_SIZE = 2048;

// Firmware Version //
var System = {
    FIRMWARE_VERSION: (1 << 24) // Major
        | (2 << 16) // Minor
        | (0 << 8)  // Revision
        | (0 << 0), // Flavor

    screenBrightness: CONST.BACKLIGHT_VALUE.MEDIUM,
    touchBrightness: CONST.BACKLIGHT_VALUE.MEDIUM,
    scrollSpeed: CONST.SCROLL_BAR_SPEED.MEDIUM,
    scrollFunction: CONST.SCROLL_BAR_FUNCTION.BOTH,

    my_clock_handler: null,
    my_timer_handler: null,

    systemTime: 0,
    clockSetTime: 0,
    clock_time: new Time(),

    timerTicks: 0,
    timerSetTicks: 0,

    userDataValid: 0,

    nv_data: new Array(CONST.CX3_DATA_SIZE)
}

/*
function FactoryMemRead(FactoryDataStruct *data) 
{
  // Desktop: return all zeros unless running factory test, then return all ones
#ifdef _FACTORY_TEST
  memset(data, 0x01, sizeof(FactoryDataStruct));
#else
  memset(data, 0, sizeof(FactoryDataStruct));
#endif
}

// Perform 'Memory Reset' 
void MemoryReset(void) {
  //TODO: exit and restart desktop simulator?
}

void FactoryMemSave(FactoryDataStruct *data) 
{
  // Desktop: nothing to do here
  return;
}
*/

function GetScreenBrightness()
{
    return System.screenBrightness;
}

function GetTouchBrightness()
{
    return System.touchBrightness;
}

function SetScreenBrightness(level)
{
    System.screenBrightness = level;
}

function SetTouchBrightness(level)
{
    System.touchBrightness = level;
}

function GetScrollBarSpeed()
{
    return System.scrollSpeed;
}

function SetScrollBarSpeed(level)
{
    System.scrollSpeed = level;
}

function GetScrollBarFunction()
{
    return System.scrollFunction;
}

function SetScrollBarFunction(level)
{
    System.scrollFunction = level;
}

function GetBatteryStatus()
{
    // for desktop simulator:
    //  default: full
    //  use 'backlight' key to change
    //  (rotates screen brightness value)

    var level;

    var bl = GetScreenBrightness();
    switch (bl) {
        case CONST.BACKLIGHT.HIGH:
            level = CONST.BATTERY_STATUS._50PERCENT;
            break;
        case CONST.BACKLIGHT.MEDIUM_HIGH:
            level = CONST.BATTERY_STATUS._25PERCENT;
            break;
        case CONST.BACKLIGHT.MEDIUM:
        default:
            level = CONST.BATTERY_STATUS.FULL;
            break;
        case CONST.BACKLIGHT.LOW:
            level = CONST.BATTERY_STATUS._75PERCENT;
            break;
    }

    if (level > CONST.BATTERY_STATUS.FULL)
        level = CONST.BATTERY_STATUS.FULL;

    return level;
}

// Fetches the clock information.
function GetClock() {
    if (arguments.length > 0) {
        assertError("Function now returns value.");
    }
    var now = new Date();
    var CX3time = {
        hours: now.getUTCHours(),
        minutes: now.getUTCMinutes(),
        seconds: now.getUTCSeconds()
    };

    if (System.clock_time.minutes != CX3time.minutes || System.clock_time.hours != CX3time.hours) {
        ClockChanged(CX3time);
    }

    System.clock_time.hours = CX3time.hours;
    System.clock_time.minutes = CX3time.minutes;
    System.clock_time.seconds = CX3time.seconds;

    return CX3time;
}

// Sets the clock information.
function SetClock(time) {

    // set system time
    System.clock_time.hours = time.hours;
    System.clock_time.minutes = time.minutes;
    System.clock_time.seconds = time.seconds;

    System.systemTime = (time.hours * 60 * 60);
    System.systemTime += (time.minutes * 60);
    System.systemTime += (time.seconds);

    //System.clockSetTime = clock()/CLOCKS_PER_SEC;

    ClockChanged(time);
}


// Registers a handler to the on change event for the clock.
function ClockRegisterOnChange(ch) {
    System.my_clock_handler = ch;
}

// Calls the clock on change handler with a Time struct pointer.
function ClockChanged(time) {
    if (System.my_clock_handler != null) {
        System.my_clock_handler(time);
    }
}

function clockTick() {
    var d = new Date();
    window.setTimeout(clockTick, 60000 - (d.getSeconds() * 1000) - d.getMilliseconds());
    GetClock();
}

/*
void StopWatchStart(void)
{
  // If we can re-start from cururent value
  // TODO: timer update: TimerUpdate = timer seconds
  //timerSetTicks = clock() - timerTicks;

  // Timer starts (or restarts) at zero (current implementation)

  timerSetTicks = clock();
}

void StopWatchStop(void)
{
  timerTicks = clock() - timerSetTicks;

}

int32_t StopWatchValue(void)
{
  int32_t value;
  value = (clock() - timerSetTicks)/CLOCKS_PER_SEC;
  StopWatchChanged(value);
  return value;
}

// Registers a handler to the on change event for the stopwatch.
void StopWatchRegisterOnChange(TimerHandler th) {
  my_timer_handler = th;
}

// Calls the stopwatch on change handler with the number of seconds elapsed.
void StopWatchChanged(int32_t value) {
  if (my_timer_handler != NULL) {
    my_timer_handler(value);
  }
}
*/

// check for valid user data in 'non-volitile' memory
function UserMemValid()
{
    return UserMemCalculateChecksum() == UserMemReadChecksum();
    /*
    var toRet = false;
    try {
      // Grab the data from local storage:
      var data = LocalStorageToArrayBuffer(CONST.NV_DATA_KEY);
      if (data !== undefined && data.byteLength == CONST.NV_DATA_SIZE) {
        // Calculate the CRC and compare:
        toRet = true;
      }
    }
    catch (e) {
      toRet = false;
    }
    return toRet;
    */
}

function UserMemSave()
{
    ArrayBufferToLocalStorage(nv_data, CONST.NV_DATA_KEY);
}

function UserMemLoad()
{
    var data = LocalStorageToArrayBuffer(CONST.NV_DATA_KEY);
    if (data !== undefined && data.byteLength == CONST.NV_DATA_SIZE) {
        // Copy the data from local storage to nv_data:
        var to = new Uint8Array(nv_data);
        var from = new Uint8Array(data);
        for (var i = 0; i < to.byteLength; i++) {
            to[i] = from[i];
        }
    }
}

// Writes data to the user RAM.
//uint8_t UserMemWrite(uint16_t addr, const void* source, uint16_t size) 
/*
function UserMemWrite(addr, source, size) 
{
  // Make sure the memory is in range:
  if((addr + size) > System.nv_data.length) {
    return 0xFF;
  }

  // Write memory to User RAM:
  for (var i = 0; i < size; i++) {
    System.nv_data[i + addr] = source[i];
  }

  return 0;
}

// Reads data from the user RAM. 
//uint8_t UserMemRead(uint16_t addr, const void* destination, uint16_t size) 
function UserMemRead(addr, destination, size) 
{
  // Make sure the memory is in range:
  if((addr + size) > System.nv_data.length) {
    return 0xFF;
  }

  // Read memory from User RAM:
  for (var i = 0; i < size; i++) {
    destination[i] = System.nv_data[i + addr];
  }

  return 0;
}
*/
// "erase" non-volatile memory
function UserMemEraseAll()
{
    EraseNVData();
}

function UserMemCalculateChecksum()
{
    var toCheck = new Uint8Array(nv_data, 0, nv_data.byteLength - 4);
    return CRC32(toCheck);
}

function UserMemReadChecksum()
{
    return nv_data_view.getUint32(nv_data.byteLength - 4, true);
}

function UserMemWriteChecksum(crc32)
{
    nv_data_view.setUint32(nv_data.byteLength - 4, crc32, true);
}
/*
void ScheduleWakeup(int32_t seconds)
{

}

void CancelWakeup(void)
{

}
*/
