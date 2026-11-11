///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: dean $
// @version $Rev: 920 $
// @date    $Date: 2013-06-25 17:22:00 -0700 (Tue, 25 Jun 2013) $
// @brief   IDs for the widgets used in the CX-3 application
//
//#ifndef __INCLUDED_WIDGETIDS_H
//#define __INCLUDED_WIDGETIDS_H

/// @brief  Contains a unique ID for each type of widget used in the UI
var CX3_WIDGET_ID = {
    VAR_STATUS_ICON: 1,
    VAR_FIELD_NAME: 2,
    VAR_VALUE: 3,
    VAR_UNITS: 4,
    VAR_LIST: 5,
    GENERIC_LIST_ITEM: 6,
    STATUSBAR_ACTIVEFUNCTION: 7,
    STATUSBAR_CLOCK: 8,
    STATUSBAR_BATTERY: 9,
    EQ_SCREEN_TITLE: 10,
    TRIP_FIELD_NAME: 11,
    TRIP_FIELD_STATUS: 12,
    CALCULATOR_TEXT: 13,
    TEST_FUNCTION: 14,
    TIMER_ITEM: 15,
    TEST_PASS: 16,
    TEST_FAIL: 17,
    MAX: 999
};

var CX3_WIDGET_EVENT = {
    EQLIST_ITEM_CLICKED: 0x8000, // Hard coded version of FIRST_EVENT so these can be used in C code.
    EQSCREEN_ITEM_CHANGED: 0x8001,
    EQSCREEN_ITEM_PREVIOUS: 0x8002,
    EQSCREEN_ITEM_NEXT: 0x8003,
    TRIP_PLAN_LEG_ADD: 0x8004,
    TRIP_PLAN_LEG_EDIT: 0x8005,
    TRIP_PLAN_LEG_REMOVE: 0x8006,
    TRIP_PLAN_LEG_SHOW: 0x8007,
    SETTING_SELECTED: 0x8008,
    OPTION_SELECTED: 0x8009,
    SET_DEFAULT_UNIT: 0x800A,
    CALCULATOR_OUTPUT_READY: 0x800B,
    TIMER_EVENT: 0x800C,
    MEMORY_FUNCTION: 0x800D,
    CLOCK_UPDATE: 0x800E,
    ROLL_ON_ENTER: 0x800F,
    ENTER_SPLASH: 0x8010,
    EXIT_SPLASH: 0x8011,
    MEMORY_CLEARED: 0x8012,
    DELAYED_INITIALIZATION: 0x8013,
    FACTORY_TEST: 0x8014
};
