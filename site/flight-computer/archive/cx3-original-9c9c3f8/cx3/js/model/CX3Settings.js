///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 643 $
// @date    $Date: 2011-12-30 15:26:10 -0800 (Fri, 30 Dec 2011) $
// @brief   CX-3 settings 
//
//#ifndef __INCLUDED_SETTINGS_H
//#define __INCLUDED_SETTINGS_H


//// @brief setting & setting string IDs
///  NOTE: must match order of Settings[] in definedVariables.cpp
// CONST.SETTING_ID = {
//   THEME : 0,
//   BACK_LIGHT : 1,
//   //SCROLL_FUNCTION : 2,
//   //SCROLL_SPEED : 3,
//   TIME_SET : 4,
//   DEFAULT_UNITS : 5,
//   UNIT_CHANGE : 6,
//   FAVORITE : 7,
//   AIRCRAFT_PROFILE : 8,
//   USER_DATA : 9,
//   VERSION : 10,
//   //ZONE_LOCAL : 11,
//   //ZONE_DEST : 12,
//   END : 13
// };

CONST.SETTING_ID = {
    THEME: 0,
    BACK_LIGHT: 1,
    TIME_SET: 2,
    DEFAULT_UNITS: 3,
    UNIT_CHANGE: 4,
    FAVORITE: 5,
    AIRCRAFT_PROFILE: 6,
    USER_DATA: 7,
    VERSION: 8,
    ZONE_LOCAL: 9,
    ZONE_DEST: 10,
    END: 11
};


CONST.SETTING_DISPLAY_MAX = CONST.SETTING_ID.VERSION;

//#endif // __INCLUDED_SETTINGS_H
