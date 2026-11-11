var Keyboard = {
    KEYBOARD_NAMES: [
        // row 7
        [
            CONST.CX3_KEY.PLUS_MINUS,
            CONST.CX3_KEY.DECIMAL,
            CONST.CX3_KEY._0,
            CONST.CX3_KEY.SQUARE_ROOT,
            CONST.CX3_KEY.EQUALS,
        ],
        // row 6
        [
            CONST.CX3_KEY.COLON,
            CONST.CX3_KEY._1,
            CONST.CX3_KEY._2,
            CONST.CX3_KEY._3,
            CONST.CX3_KEY.PLUS,
        ],
        // row 5
        [
            CONST.CX3_KEY.BACKSPACE,
            CONST.CX3_KEY._4,
            CONST.CX3_KEY._5,
            CONST.CX3_KEY._6,
            CONST.CX3_KEY.MINUS,
        ],
        // row 4
        [
            CONST.CX3_KEY.CLEAR,
            CONST.CX3_KEY._7,
            CONST.CX3_KEY._8,
            CONST.CX3_KEY._9,
            CONST.CX3_KEY.MULTIPLY,
        ],
        // row 3
        [
            CONST.CX3_KEY.MEMORY,
            CONST.CX3_KEY.SET_UNIT,
            CONST.CX3_KEY.DOWN_ARROW,
            CONST.CX3_KEY.CONV_UNIT,
            CONST.CX3_KEY.DIVIDE,
        ],
        // row 2
        [
            CONST.CX3_KEY.BACK,
            CONST.CX3_KEY.FAVS,
            CONST.CX3_KEY.ENTER,
            //CONST.CX3_KEY.BACKLIGHT,
            CONST.CX3_KEY.WTBAL,
            CONST.CX3_KEY.SETTINGS,
        ],
        // row 1
        [
            CONST.CX3_KEY.FLIGHT,
            CONST.CX3_KEY.PLAN,
            CONST.CX3_KEY.UP_ARROW,
            CONST.CX3_KEY.TIMER,
            CONST.CX3_KEY.CALC,
        ]
    ],

    enabled: false,

    // Enable the keypad map events:
    initialize: function () {
        if (DEBUG) {
            console.log("initialize keyboard");
        }

        //replacing imagemap areas with jquery based div buttons
        var buttons = jQuery('#flight-calculator-button-wrapper .flight-calculator-button');

        // Need a touch listener on the document.  Don't know why.
        document.addEventListener("touchstart", function (evt) { }, false);

        // add keypress event handler to each area of the calculator key image map
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", Keyboard.keypadClicked, false);
            buttons[i].addEventListener("touchstart", Keyboard.keypadClicked, false);
        }

        // listen for "cx3-keypress" events when debugging
        if (DEBUG) {
            document.addEventListener("cx3-keypress", debugKeypadPress);
        }
    },

    // DOM event handler called when a key is clicked.
    keypadClicked: function (evt) {
        if (typeof evt.preventDefault == "function") {
            evt.preventDefault();
        }
        Keyboard.keypadPress(this.dataset.row, this.dataset.col);
        // console.log("this.dataset.row=" + this.dataset.row);
        // console.log("this.dataset.col=" + this.dataset.col);
    },

    // Issues a keypad press on a given row and column.
    keypadPress: function (r, c) {
        Keyboard.sendKeypadEvent(Keyboard.KEYBOARD_NAMES[r][c]);
    },

    // Issues a keypad press based on the key name.
    sendKeypadEvent: function (key) {
        if (Keyboard.enabled === true) {
            var evt = new CustomEvent("cx3-keypress", {
                detail: {
                    keyName: key
                },
                bubbles: true,
                cancelable: true
            });
            var elem = Screen.activeElement;
            if (elem != null) {
                elem.dispatchEvent(evt);
            }
            else if (DEBUG) {
                console.log("No active element");
            }
        }
    }
}

function debugKeypadPress(evt) {
    console.log("debugKeypadPress: " + evt.detail.keyName);
}

window.addEventListener('load', Keyboard.initialize, false);
