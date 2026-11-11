///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 643 $
// @date    $Date: 2011-12-30 15:26:10 -0800 (Fri, 30 Dec 2011) $
// @brief   CX-3 User Data - stored in non-volatile memory
//
//#ifndef __INCLUDED_CX3USERDATA_H
//#define __INCLUDED_CX3USERDATA_H
//
//#include "CX3Settings.h"
//#include "CX3Equations.h"
//#include "calculator.h"
//#include "definedVariables.h"
//
//using namespace Calculator;

//// @brief variable as saved in NV user data
//// input: bit0=1: input value (not calculated)
////    bit1=1: input value copied (bit0 must =1)
function UserVariable() {
    this.input = CONST.NO_VALUE;
    this.unit = CONST.NO_VALUE;    // variable prefered unit index
    this.value = CONST.NO_VALUE;    // variable value
}

CONST.USER_VAR = {
    INPUT: 0x01,
    COPIED: 0x02,
    CALCULATED: 0x04
};

// Added functions to DataView to get/set UserVariables:
DataView.prototype.setUserVariable = function (offset, uv, little_endian) {
    little_endian = (typeof little_endian !== "undefined") ? little_endian : false;
    this.setUint8(offset, uv.input, little_endian);
    this.setUint8(offset + 1, uv.unit, little_endian);
    this.setFloat64(offset + 4, uv.value, little_endian);
}

DataView.prototype.getUserVariable = function (offset, little_endian) {
    var toRet = new UserVariable();
    little_endian = (typeof little_endian !== "undefined") ? little_endian : false;
    toRet.input = this.getUint8(offset, little_endian);
    toRet.unit = this.getUint8(offset + 1, little_endian);
    toRet.value = this.getFloat64(offset + 4, little_endian);
    return toRet;
}

// The size of the UserVariable structure in memory (must match size for the physical device)
CONST.USER_VARIABLE_SIZE = 12;

CONST.NV_DATA_SIZE = 2048;
CONST.NV_DATA_KEY = "nv_data";

var nv_data = new ArrayBuffer(CONST.NV_DATA_SIZE);
var nv_data_view = new DataView(nv_data);

// Fill it with all 0xFF:
function EraseNVData() {
    for (var i = 0; i < nv_data.byteLength; i++) {
        nv_data_view.setUint8(i, 0xFF, true);
    }
}
EraseNVData();

var NV_ADDR = {};

//// @brief address offset of settings in user data NV data
///  NOTE: Settings matches order of SettingID_t in CX3Settings.h except for timzones
///  NOTE: offset next addr by sizeof() for multi-byte variables 
NV_ADDR.SETTING = {};
NV_ADDR.SETTING.THEME = 0;
NV_ADDR.SETTING.BACK_LIGHT = 1;
NV_ADDR.SETTING.SCROLL_FUNCTION = 2;
NV_ADDR.SETTING.SCROLL_SPEED = 3;
NV_ADDR.SETTING.TIME_SET = 4;
NV_ADDR.SETTING.DEFAULT_UNITS = 5;
NV_ADDR.SETTING.UNIT_CHANGE = 6;
NV_ADDR.SETTING.FAVORITE = 7;
NV_ADDR.SETTING.ZONE_LOCAL = 8;
NV_ADDR.SETTING.ZONE_DEST = 9;
NV_ADDR.SETTING.END = 10;

//// @brief address offset of aircraft profile in user data NV data
///  NOTE: offset next addr by sizeof() for multi-byte variables 
NV_ADDR.AIRCRAFT = {};
NV_ADDR.AIRCRAFT.CAL_K = NV_ADDR.SETTING.END;
NV_ADDR.AIRCRAFT.RF = NV_ADDR.AIRCRAFT.CAL_K + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.WEIGHT = NV_ADDR.AIRCRAFT.RF + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.ARM = NV_ADDR.AIRCRAFT.WEIGHT + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.MOM = NV_ADDR.AIRCRAFT.ARM + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.FUEL_TYPE = NV_ADDR.AIRCRAFT.MOM + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.FUEL_ARM = NV_ADDR.AIRCRAFT.FUEL_TYPE + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.PILOT_ARM = NV_ADDR.AIRCRAFT.FUEL_ARM + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.PAX1_ARM = NV_ADDR.AIRCRAFT.PILOT_ARM + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.PAX2_ARM = NV_ADDR.AIRCRAFT.PAX1_ARM + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.CARGO1_ARM = NV_ADDR.AIRCRAFT.PAX2_ARM + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.CARGO2_ARM = NV_ADDR.AIRCRAFT.CARGO1_ARM + CONST.USER_VARIABLE_SIZE;
NV_ADDR.AIRCRAFT.END = NV_ADDR.AIRCRAFT.CARGO2_ARM + CONST.USER_VARIABLE_SIZE;

//// @brief address offset of Weight & Balance using aircraft profile in user data NV data
///  NOTE: offset next addr by sizeof() for multi-byte variables 
NV_ADDR.WT_BAL_AIRCRAFT = {};
NV_ADDR.WT_BAL_AIRCRAFT.INPUTS = NV_ADDR.AIRCRAFT.END;
NV_ADDR.WT_BAL_AIRCRAFT.OUTPUTS = NV_ADDR.WT_BAL_AIRCRAFT.INPUTS + (CONST.USER_VARIABLE_SIZE * CONST.MAX_AIRCRAFT_INPUT_ITEMS);
NV_ADDR.WT_BAL_AIRCRAFT.END = NV_ADDR.WT_BAL_AIRCRAFT.OUTPUTS + (CONST.ALL_AIRCRAFT_VARIABLES - CONST.MAX_AIRCRAFT_INPUT_ITEMS);

//// @brief address offset of Weight & Balance items in user data NV data
///  NOTE: offset next addr by sizeof() for multi-byte variables 
NV_ADDR.WT_BAL_ITEMS = {};
NV_ADDR.WT_BAL_ITEMS.ACTIVE = NV_ADDR.WT_BAL_AIRCRAFT.END;
NV_ADDR.WT_BAL_ITEMS.ACTIVE_MAX = NV_ADDR.WT_BAL_ITEMS.ACTIVE + 1;
NV_ADDR.WT_BAL_ITEMS.STATUS = NV_ADDR.WT_BAL_ITEMS.ACTIVE_MAX + 1;
NV_ADDR.WT_BAL_ITEMS.RF = NV_ADDR.WT_BAL_ITEMS.STATUS + CONST.MAX_ITEMS;
NV_ADDR.WT_BAL_ITEMS.VARIABLES = NV_ADDR.WT_BAL_ITEMS.RF + CONST.USER_VARIABLE_SIZE;
NV_ADDR.WT_BAL_ITEMS.OUTPUT_EQU = NV_ADDR.WT_BAL_ITEMS.VARIABLES + (CONST.USER_VARIABLE_SIZE * CONST.MAX_ITEMS * CONST.VARIABLES_PER_ITEM);
NV_ADDR.WT_BAL_ITEMS.END = NV_ADDR.WT_BAL_ITEMS.OUTPUT_EQU + CONST.ITEMS_OUTPUT_EQUATIONS;

//// @brief address offset of Trip Planner in user data NV data
///  NOTE: offset next addr by sizeof() for multi-byte variables 
NV_ADDR.TRIP = {};
NV_ADDR.TRIP.LEGS_ACTIVE = NV_ADDR.WT_BAL_ITEMS.END;
NV_ADDR.TRIP.LEG_1 = NV_ADDR.TRIP.LEGS_ACTIVE + CONST.MAX_TRIP_PLAN_LEGS;
NV_ADDR.TRIP.LEG_2 = NV_ADDR.TRIP.LEG_1 + (CONST.USER_VARIABLE_SIZE * CONST.TRIP_LEG_INPUTS) + (CONST.TRIP_LEG_VARIABLES - CONST.TRIP_LEG_INPUTS);
NV_ADDR.TRIP.LEG_3 = NV_ADDR.TRIP.LEG_2 + (CONST.USER_VARIABLE_SIZE * CONST.TRIP_LEG_INPUTS) + (CONST.TRIP_LEG_VARIABLES - CONST.TRIP_LEG_INPUTS);
NV_ADDR.TRIP.LEG_4 = NV_ADDR.TRIP.LEG_3 + (CONST.USER_VARIABLE_SIZE * CONST.TRIP_LEG_INPUTS) + (CONST.TRIP_LEG_VARIABLES - CONST.TRIP_LEG_INPUTS);
NV_ADDR.TRIP.OUTPUTS = NV_ADDR.TRIP.LEG_4 + (CONST.USER_VARIABLE_SIZE * CONST.TRIP_LEG_INPUTS) + (CONST.TRIP_LEG_VARIABLES - CONST.TRIP_LEG_INPUTS);
NV_ADDR.TRIP.END = NV_ADDR.TRIP.OUTPUTS + CONST.MAX_TRIP_PLAN_LEGS;

//// @brief address of user data blocks in NV data offset from zero
NV_ADDR.SETTING_START = 0,
    NV_ADDR.AIRCRAFT_PROFILE_START = NV_ADDR.SETTING.END,
    NV_ADDR.AIRCRAFT_EQUATIONS_START = NV_ADDR.AIRCRAFT.WEIGHT,
    NV_ADDR.WT_BAL_AIRCRAFT_START = NV_ADDR.AIRCRAFT.END,
    NV_ADDR.WT_BAL_ITEMS_START = NV_ADDR.WT_BAL_AIRCRAFT.END,
    NV_ADDR.TRIP_START = NV_ADDR.WT_BAL_ITEMS.END,
    NV_ADDR.END = NV_ADDR.TRIP_END

// Function for writing an ArrayBuffer to localStorage.
function ArrayBufferToLocalStorage(buffer, local_key) {
    var u8_array = new Uint8Array(buffer);
    var data_string = Array.prototype.join.call(u8_array, ",");
    localStorage.setItem(local_key, data_string);
}

// Function for reading an ArrayBuffer from localStorage.
function LocalStorageToArrayBuffer(local_key) {
    try {
        var data_string = localStorage.getItem(local_key);
        var u8_array = new Uint8Array(data_string.split(","));
        return u8_array.buffer;
    }
    catch (e) {
        return undefined;
    }
}

// Function for creating the data's URL.
function CreateDataURL(data) {
    // Create a blob from the data:
    var blob = new Blob([data], { type: "application/octet-binary", size: data.byteLength });
    // Create the blob url:
    return URL.createObjectURL(blob);
}

function GetNVDataURL() {
    // If a URL already exists, request that it be deleted:
    if (this.url !== undefined) {
        DeleteDataURL(this.url);
    }
    // Create the url:
    this.url = CreateDataURL(nv_data);

    return this.url;
}

// Function for freeing a data URL.
function DeleteDataURL(url) {
    URL.revokeObjectURL(url);
}

// Build the crc32 lookup table:
CONST.CRC32_TABLE = new Array(256);
//CONST.CRC32_POLY = 0x04C11DB7;
CONST.CRC32_POLY = 0xEDB88320;
function BuildCRC32Table() {
    for (var i = 0; i < 256; i++) {
        var temp = i;
        for (var j = 0; j < 8; j++) {
            temp = (temp & 1) ? (temp >>> 1) ^ CONST.CRC32_POLY : (temp >>> 1);
        }
        CONST.CRC32_TABLE[i] = temp;
    }
}
BuildCRC32Table();

// Function for computing CRC32:
// This only works for aligned arrays that are a multiple of 4 bytes and deals with
// the endian issue.
// arr - a Uint8Array to find the crc32 value of.
function CRC32(arr) {
    var crc = -1;
    for (var i = 0; i < arr.byteLength; i++) {
        crc = (crc >>> 8) ^ CONST.CRC32_TABLE[0xFF & (crc ^ arr[Math.floor(i / 4) * 4 + (3 - (i % 4))])];
    }
    return ~crc;
}
