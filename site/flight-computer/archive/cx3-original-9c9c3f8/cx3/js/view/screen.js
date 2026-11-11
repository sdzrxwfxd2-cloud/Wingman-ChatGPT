CONST.THEMES = [
  "theme-standard",
  "theme-night",
  "theme-daylight"
];

var Screen = {
  // Private:
  // The current active DOM element in the application:
  activeElement_ : null,

  // Cached elements to reduce DOM lookups:
  cache_ : [],

  // Public:
  // Scrolls the screen in order to make sure elem is within view:
  scrollItemIntoScreen : function(elem) {
    // Get the screen:
    var screen = Screen.element;
    // Get the bounding box of the screen and element:
    var screenBB = screen.getBoundingClientRect();
    var elemBB = elem.getBoundingClientRect();

    // Is the element lower than the bottom of the screen?
    if (elemBB.bottom > screenBB.bottom) {
      // Scroll up until it is in view:
      screen.scrollTop += elemBB.bottom - screenBB.bottom;
    }
    // Is the element higher than the top of the screen?
    else if (elemBB.top < screenBB.top) {
      // Scroll down until it is in view:
      screen.scrollTop -= screenBB.top - elemBB.top;
    }
  },

  // Gets the status bar title:
  get title() {
    var title_node = document.getElementById("status-bar-title");
    return title_node.innerText || title_node.textContent;
  },

  // Sets the status bar title:
  set title(text) {
    var title_node = document.getElementById("status-bar-title");
    title_node.innerText = text;
    title_node.textContent = text;
  },

  formatClock : function(h, m, localIsZulu) {
    var time_string = ("0" + h.toFixed(0)).slice(-2) + ":" + ("0" + m.toFixed(0)).slice(-2);
    if (localIsZulu) {
      time_string += "Z";
    };

    return time_string
  },

  // Sets the clock text:
  set clock(text) {
    var clock_node = document.getElementById("status-bar-clock");
    clock_node.innerText = text;
    clock_node.textContent = text;
  },

  // Gets the clock text:
  get clock() {
    var clock_node = document.getElementById("status-bar-clock");
    return clock_node.innerText || clock_node.textContent;
  },

  // Sets the subtitle:
  set subtitle(text) {
    var subtitle_node = document.getElementById("subtitle");
    subtitle_node.innerText = text;
    subtitle_node.textContent = text;
  },

  // Gets the subtitle:
  get subtitle() {
    var subtitle_node = document.getElementById("subtitle");
    return subtitle_node.innerText || subtitle_node.textContent;
  },

  // Sets whether the subtitle is visible:
  setSubtitleVisibility: function(vis) {
    if (vis) {
      document.getElementById("subtitle").show();
    }
    else {
      document.getElementById("subtitle").hide();
    }
  },

  get activeElement() {
    return Screen.activeElement_;
  },

  set activeElement(elem) {
    if (elem == null) {
      Screen.clearActiveElement();
      return;
    }
    else if (elem === Screen.activeElement_) {
      return;
    }

    Screen.clearActiveElement();
    Screen.activeElement_ = elem;

    elem.addClass("active");
    Screen.scrollItemIntoScreen(Screen.activeElement_);
  },

  clearActiveElement : function() {
    if (Screen.activeElement_ != null) {
      Screen.activeElement_.removeClass("active");
    }
    Screen.activeElement_ = null;
  },

  // The DOM element with ID screen:
  get element() {
    if (Screen.cache_.element === undefined) {
      Screen.cache_.element = document.getElementById("screen");
    }
    return Screen.cache_.element;
  },

  set theme(css_theme) {
    // Make sure this is a valid theme:
    if (CONST.THEMES.indexOf(css_theme) != -1) {
      var content = document.getElementById("content");
      // Remove any of the other themes:
      for (t in CONST.THEMES) {
        content.removeClass(CONST.THEMES[t]);
      }
      // Add the new theme:
      content.addClass(css_theme);
    }
    else {
      assertError("Invalid Theme", css_theme);
    }
  },

  get theme() {
    // Match on any of the themes:
    var pattern = new RegExp("\\b" + CONST.THEMES.join("\\b|\\b") + "\\b");
    var content = document.getElementById("content");
    var toRet = pattern.exec(content.className);
    // If no themes are found, then return the default:
    if (toRet == null) {
      toRet = CONST.THEMES[0]; // Default is standard.
    }
    else {
      toRet = toRet[0];
    }
    return toRet;
  }
}

function ClockDisplay() {
  Observable.call(this);
  this.var_ = ClockUpdate;
  this.preferredUnits_ = new Pointer(time_local);
  ClockUpdate.setUseDefaultUnit(true);
  ClockUpdate.setPreferredUnit(this.preferredUnits_);
  // Sign up for notifications from our variable.
  this.var_.addDependent(this);
}
// ClockDisplay is a subclass of Observable:
ClockDisplay.inheritsFrom(Observable);

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    The underlying variable has changed.  Figure out what is different and
///    update the display.
///
///  @param [in] <from> <pointer to the object that is sending the update>
///
///  @param [in] <int> <not used here>
///
////////////////////////////////////////////////////////////////////////////////
ClockDisplay.prototype.update = function(from) {
  //char time_string[10];
  var clock;
  var t = new Time();

  // Make sure that the notification is from our variable
  if (from == this.var_) {
    clock = this.var_.valueInDefaultUnits();
    // make sure 0-24 hours
    if (clock < 0) {
      clock += (24*60*60);    //add 24 hours 
    }

    clock = Math.round(clock);
      
    t.hours = Math.floor(clock/3600);
    clock = clock - (3600*t.hours);

    t.minutes = Math.floor(clock/60);
    
    t.hours = t.hours % 24;
    
    var localIsZulu = time_local.name() == "UTC"
    Screen.clock = Screen.formatClock(t.hours, t.minutes, localIsZulu);

    // pass event up to parent
    //TODO dean: is this needed?
    /*
    pm_event_t NewEvent(CX3_PRISM_EVENT_CLOCK_UPDATE);
        NewEvent.pSource = this;
        NewEvent.pTarget = Parent();
        EventManager()->PostTail(NewEvent);
        */
  }
}
var clockDisplayer = new ClockDisplay();

function resizeCalculator(evt) {
  // Reset the scale to 100%:
  document.body.style.transformOrigin = "50% 0";
  document.body.style.webkitTransformOrigin = "50% 0";
  document.body.style.transform = "scale(1)";
  document.body.style.webkitTransform = "scale(1)";

  // Get width of actual objects:
  var content = document.getElementById("content");
  var options = document.getElementById("options");
  var width = content.getBoundingClientRect().width;
  var height = content.getBoundingClientRect().bottom + options.getBoundingClientRect().height;

  // Get the targetted width/height:
  var target_width = window.innerWidth;
  var target_height = window.innerHeight;

  // Find the minimum scaler:
  var scaleX = target_width / width;
  var scaleY = target_height / height;

  var scale = (scaleX < scaleY)? scaleX : scaleY;

  // Scale the document:
  var scale_string = "scale(" + scale + ")";
  document.body.style.transform = scale_string;
  document.body.style.webkitTransform = scale_string;
}

// SMR: disable resizing for now
// window.addEventListener("resize", resizeCalculator);
// window.addEventListener("load", resizeCalculator);




