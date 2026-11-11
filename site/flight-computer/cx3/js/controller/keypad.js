///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 716 $
// @date    $Date: 2012-02-22 16:54:05 -0800 (Wed, 22 Feb 2012) $
// @brief   IDs for the widgets used in the CX-3 application
//
/// @brief  number rows, columns, total keys
//#define CX3_KEY_ROWS    7
//#define CX3_KEY_COLUMNS    5
//#define CX3_KEY_TOTAL    (CX3_KEY_ROWS * CX3_KEY_COLUMNS)

/// @brief  key definitions
CONST.CX3_KEY = {
    // row 1
    FLIGHT: 'F1',
    PLAN: 'F2',
    UP_ARROW: 'Up',
    TIMER: 'F3',
    CALC: 'F4',
    // row 2
    BACK: 'Escape',
    FAVS: 'f',
    ENTER: 'Enter',
    //BACKLIGHT   : 'l',
    WTBAL: 'w',  // TODO: should this be an F key?
    SETTINGS: 's',
    // row 3
    MEMORY: 'm',
    SET_UNIT: 'F5',
    DOWN_ARROW: 'Down',
    CONV_UNIT: 'F6',
    DIVIDE: '/',
    // row 4
    CLEAR: 'Delete',
    _7: '7',
    _8: '8',
    _9: '9',
    MULTIPLY: '*',
    // row 5
    BACKSPACE: 'Backspace',
    _4: '4',
    _5: '5',
    _6: '6',
    MINUS: '-',
    // row 6
    COLON: ':',
    _1: '1',
    _2: '2',
    _3: '3',
    PLUS: '+',
    // row 7
    PLUS_MINUS: '~',
    DECIMAL: '.',
    _0: '0',
    SQUARE_ROOT: '\u221A', // Needs to be a single character for the calculator to work.
    EQUALS: '='
};

CONST.CHAR_KEYS = [
    CONST.CX3_KEY._0,
    CONST.CX3_KEY._1,
    CONST.CX3_KEY._2,
    CONST.CX3_KEY._3,
    CONST.CX3_KEY._4,
    CONST.CX3_KEY._5,
    CONST.CX3_KEY._6,
    CONST.CX3_KEY._7,
    CONST.CX3_KEY._8,
    CONST.CX3_KEY._9,
    CONST.CX3_KEY.DECIMAL,
    CONST.CX3_KEY.PLUS,
    CONST.CX3_KEY.MINUS,
    CONST.CX3_KEY.MULTIPLY,
    CONST.CX3_KEY.DIVIDE,
    CONST.CX3_KEY.COLON
];

CONST.TIMER_KEYS = [
    CONST.CX3_KEY._0,
    CONST.CX3_KEY._1,
    CONST.CX3_KEY._2,
    CONST.CX3_KEY._3,
    CONST.CX3_KEY._4,
    CONST.CX3_KEY._5,
    CONST.CX3_KEY._6,
    CONST.CX3_KEY._7,
    CONST.CX3_KEY._8,
    CONST.CX3_KEY._9,
    CONST.CX3_KEY.COLON,
];

