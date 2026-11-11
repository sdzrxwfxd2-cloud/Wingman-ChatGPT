var Test = {
    keyboardAction: function (evt) {
        if (Screen.activeElement != null) {
            if (evt.detail.keyName == CONST.CX3_KEY.DOWN_ARROW && Screen.activeElement.nextElementSibling != null) {
                Screen.activeElement = Screen.activeElement.nextElementSibling;
            }
            else if (evt.detail.keyName == CONST.CX3_KEY.UP_ARROW && Screen.activeElement.previousElementSibling != null) {
                Screen.activeElement = Screen.activeElement.previousElementSibling;
            }
        }
    },

    clockTick: function () {
        var d = new Date();
        window.setTimeout(Test.clockTick, 60000 - (d.getSeconds() * 1000) - d.getMilliseconds());
        GetClock();
    },

    initialize: function () {
        //document.addEventListener("cx3-keypress", Test.keyboardAction);
        //Test.clockTick();
    }
};

window.addEventListener("load", Test.initialize);
