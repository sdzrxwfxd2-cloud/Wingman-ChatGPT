///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  
//  Class Name: tripPlannerScreen
//  
//   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
//  
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: mike $
// @version $Rev: 402 $
// @date    $Date: 2011-06-07 07:39:44 -0700 (Tue, 07 Jun 2011) $
// @brief   used to display trip planner main screen 
////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

//#include "prism_includes.h"
//#include "calculator.h"
//#include "CX3_UI_res.h"
//#include "tripPlannerScreen.h"
//#include "widgetIDs.h"
//#include "calc_utility.h"
//#include <string.h>
//
//// Fix name issues with EWL
//#ifdef _EWL_STRING_H
//#define strnlen strnlen_s
//#endif

// Text for status
CONST.LEGSTATUSTEXT = [
    " ",
    "Add",
    "Review & Edit",
    "Remove",
    "Review"
];

CONST.MAINTENANCE_PASSWORD = [
    CONST.CX3_KEY._1, CONST.CX3_KEY._9, CONST.CX3_KEY._7, CONST.CX3_KEY._3
];

CONST.DATARESET_PASSWORD = [
    CONST.CX3_KEY._1, CONST.CX3_KEY._9, CONST.CX3_KEY._4, CONST.CX3_KEY._7
];

/*
using namespace Variables;

namespace CX3_UI {
*/

/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
/*
pm_event_table_entry tripPlannerScreenEvents[] = {
  { PM_EVENT_KEYPAD_PUSH,              PM_EVENT_HANDLER(&tripPlannerScreen::OnEventKeypadPush)},
  { PM_EVENT_HIDE,                PM_EVENT_HANDLER(&tripPlannerScreen::OnEventHide)},
  { CX3_WIDGET_EVENT.TRIP_PLAN_LEG_ADD,      PM_EVENT_HANDLER(&tripPlannerScreen::OnEventLegAdded)},
  { CX3_WIDGET_EVENT.TRIP_PLAN_LEG_EDIT,      PM_EVENT_HANDLER(&tripPlannerScreen::OnEventLegEdit)},
  { CX3_WIDGET_EVENT.TRIP_PLAN_LEG_REMOVE,      PM_EVENT_HANDLER(&tripPlannerScreen::OnEventLegRemoved)},
};
*/

var TRIP_PLAN_LEG_STATUS = {
    NONE: 0,
    ADD: 1,
    EDIT: 2,
    REMOVE: 3,
    REVIEW: 4
};

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default tripPlannerScreen panel and creates the children.  Memory
///    is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
///  @param [in] <size> <Display size for this panel>
///
////////////////////////////////////////////////////////////////////////////////
function TripPlannerScreen() {
    Panel.call(this);

    this.title = "TRIP";

    // Create the variable container widgets and add to the list
    this.trip_items_ = new Array(11);
    for (var i = 0; i < this.trip_items_.length; i++) {
        this.trip_items_[i] = new CX3TripItemWidget();
    }

    // Ititalize leg status
    this.leg_status_ = new Array(CONST.MAX_TRIP_PLAN_LEGS + 1);
    this.leg_status_[0] = TRIP_PLAN_LEG_STATUS.REVIEW;
    this.leg_status_[1] = TRIP_PLAN_LEG_STATUS.ADD;

    for (var i = 2; i < this.leg_status_.length; i++) {
        this.leg_status_[i] = TRIP_PLAN_LEG_STATUS.NONE;
    }

    this.maintenanceMode_ = false;
    this.keyCount_ = 0;
    this.dataResetkeyCount_ = 0;
    this.preferredUnits_ = null;

    // Settings: use default units = true
    // Backlight - default medium
    Backlight.setUseDefaultUnit(true);
    Backlight.setDefaultUnit(backlight_normal);
    ScrollSpeed.setUseDefaultUnit(true);

    // Add event listeners:
    this.addEvent("cx3-keypress", Panel.EVENTS.DEFAULT_NAVIGATION);
    this.addEvent("cx3-keypress", this.OnEventKeypadPush);
    this.addEvent(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_ADD, this.OnEventLegAdded);
    this.addEvent(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_EDIT, this.OnEventLegEdit);
    this.addEvent(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_REMOVE, this.OnEventLegRemoved);
}
// TripPlannerScreen is a subclass of Panel:
TripPlannerScreen.inheritsFrom(Panel);

/*
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clean up after ourselves and remove memory that we may have allocated.
///
////////////////////////////////////////////////////////////////////////////////
tripPlannerScreen::~tripPlannerScreen() {
  for (unsigned int i = 0; i < ARRAY_SIZE(this.trip_items_); i++) {
    Destroy(this.trip_items_[i]);
  }

  // takes care of the list
  Destroy(this.tripList_);
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Main event handler function.  Searches our event table to see if our
///    class processes the specified event.
///
///  @param [in] <Event> <Event to be processed>
///
///  @return <whatever the matching function (or base class if there isn't one)
///        returns>
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.Notify = function(const pm_event_t &Event) {
  pm_event_table_entry *pEventList = tripPlannerScreenEvents;

  while(pEventList.EventType) {
    if (pEventList.EventType == Event.Type) {
      if (pEventList.Handler == NULL) {
        return 0;
      }
      return PM_CALL_EVENT_HANDLER(*this, pEventList.Handler)(Event);
    }
    pEventList++;
  }

  return Pm_Panel::Notify(Event);
}
*/

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Displays the Trip Planner screen
///
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.ShowTripPlanner = function (leg_focus) {
    var tmp = "";
    var focus = 0;

    // Clear the widget list
    this.clearListData();

    // 1st Item: totals
    this.leg_status_[0] = TRIP_PLAN_LEG_STATUS.REVIEW; //this should always be review
    this.AddItem("Total Trip", "Review", CX3_WIDGET_EVENT.TRIP_PLAN_LEG_EDIT, 0, 0);

    // Fill rest of list
    var temp_status = TRIP_PLAN_LEG_STATUS.REVIEW;
    var i = 1;
    var index = 1;  //

    while ((temp_status != TRIP_PLAN_LEG_STATUS.NONE) && (i < CONST.MAX_TRIP_PLAN_LEGS + 1)) {
        temp_status = this.leg_status_[i];

        if (temp_status != TRIP_PLAN_LEG_STATUS.NONE) {
            // check for focus on this leg
            if (leg_focus == i) {
                focus = index;
            }

            // Add leg & leg temp_status text
            tmp = "Leg " + i;
            this.AddItem(tmp, CONST.LEGSTATUSTEXT[temp_status], (temp_status + (CX3_WIDGET_EVENT.TRIP_PLAN_LEG_ADD - 1)), i, 0);
            index++;

            // add 'remove' list item 
            if (temp_status == TRIP_PLAN_LEG_STATUS.EDIT) {
                this.AddItem(" ", "Remove", CX3_WIDGET_EVENT.TRIP_PLAN_LEG_REMOVE, i, 0);
                index++;
            }
        }

        i++;
    }

    // Set focus
    this.activeChild = this.children_[focus];
    //this.tripList_.SetSelected(focus);

}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Displays main Settings screen
///
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.ShowSettingsMain = function (focus) {
    var CLOCK_STRING_SIZE = 14
    var VERSION_STRING_SIZE = 16      //max (3 digit)x4 + (3 decimal) + (1 null) 
    var clock_string = "";
    var version_string = "";
    var major, minor, revision, flavor;
    var clock_time;

    // Get current settings

    // Backlight - set when backlight key pressed or setting changed

    // Scroll speed 
    var speed = GetScrollBarSpeed();
    if (speed == CONST.SCROLL_BAR_SPEED.FAST) {
        ScrollSpeed.setDefaultUnit(scroll_fast);
    }
    else if (speed == CONST.SCROLL_BAR_SPEED.MEDIUM) {
        ScrollSpeed.setDefaultUnit(scroll_med);
    }
    else {
        ScrollSpeed.setDefaultUnit(scroll_slow);
    }

    // Scroll function
    var funct = GetScrollBarFunction();
    if (funct == CONST.SCROLL_BAR_FUNCTION.SCROLL) {
        ScrollFunction.setDefaultUnit(slider_slide);
    }
    else if (funct == CONST.SCROLL_BAR_FUNCTION.TAP) {
        ScrollFunction.setDefaultUnit(slider_tap);
    }
    else {
        ScrollFunction.setDefaultUnit(slider_both);
    }

    // Clock - current time 
    // TODO: create routine to display time in HH:MM PST format (where PST = local time zone)
    clock_time = GetClock();
    Clock.copyFromValue(clock_time.hours * 3600 + clock_time.minutes * 60);
    var hours = Math.floor(clock_time.hours - (Clock.defaultUnit().offset() / 3600)) % 24;
    if (hours < 0) {
        hours += 24;
    }

    clock_string = ("0" + hours.toFixed(0)).slice(-2)
    clock_string += ":" + ("0" + clock_time.minutes.toFixed(0)).slice(-2);
    clock_string += " " + Clock.defaultUnit().name();

    // Version
    major = 0xFF & (System.FIRMWARE_VERSION >> 24);
    minor = 0xFF & (System.FIRMWARE_VERSION >> 16);
    revision = 0xFF & (System.FIRMWARE_VERSION >> 8);
    flavor = 0xFF & (System.FIRMWARE_VERSION);

    if (revision | flavor) {
        version_string = major + "." + minor + "." + revision + "." + flavor;
    }
    else if (revision) {
        version_string = major + "." + minor + "." + revision;
    }
    else {
        version_string = major + "." + minor;
    }

    // Clear the widget list
    // Next line commented out by Dean. Is this necessary?
    //  var idx = this.tripList_.GetSelectedIndex();
    //KillFocus(this.tripList_.GetThing(idx));
    //Unlink(this.tripList_);
    this.clearListData();

    // Fill in list
    for (var i = 0; i <= CONST.SETTING_DISPLAY_MAX; i++) {
        if (CONST.SETTINGS[i] == Clock) {
            this.AddItem(Clock.name(), clock_string, CX3_WIDGET_EVENT.SETTING_SELECTED, i, (WIDGET_FLAG.CX3_TIMER_ITEM | WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE));
        }
        else if (CONST.SETTINGS[i] == Favorite) {
            if (Favorite.hasValue())
                this.AddItem("Favorite", "Show", CX3_WIDGET_EVENT.SETTING_SELECTED, i, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
            else
                this.AddItem("Favorite", "Set", CX3_WIDGET_EVENT.SETTING_SELECTED, i, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
        }
        else if (CONST.SETTINGS[i] == AircraftProfile) {
            this.AddItem("Aircraft Profile", "Edit", CX3_WIDGET_EVENT.SETTING_SELECTED, i, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
        }
        else if (CONST.SETTINGS[i] == ScrollFunction) {
            this.AddItem(CONST.SETTINGS[i].name(), CONST.SETTINGS[i].defaultUnit().name(),
                CX3_WIDGET_EVENT.SETTING_SELECTED, i, (WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE | WIDGET_FLAG.CX3_TIMER_ITEM));
        }
        else if (CONST.SETTINGS[i] == UserData) {
            if (UserMemValid())
                this.AddItem(UserData.name(), "Save-Recall", CX3_WIDGET_EVENT.SETTING_SELECTED, i, (WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE | WIDGET_FLAG.CX3_TIMER_ITEM));
            else
                this.AddItem(UserData.name(), "Save", CX3_WIDGET_EVENT.SETTING_SELECTED, i, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
        }

        else if (CONST.SETTINGS[i] == FirmwareVersion) {
            this.AddItem(FirmwareVersion.name(), version_string, 0, i, (WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE | WIDGET_FLAG.CX3_TIMER_ITEM));
        }
        else
            this.AddItem(CONST.SETTINGS[i].name(), CONST.SETTINGS[i].defaultUnit().name(), CX3_WIDGET_EVENT.SETTING_SELECTED, i, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);

    }

    // Check for maintanence mode
    if (this.maintenanceMode_ == true) {
        AddItem("Factory Test", " ", CX3_WIDGET_EVENT.FACTORY_TEST, 0, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
    }

    //Link(this.tripList_);

    // set or reset focus
    if (focus > CONST.SETTING_DISPLAY_MAX)
        focus = idx;    // set to last focus item
    // don't re-set focus on 1st item (item #0) - this causes issues when screen is reloaded
    if (focus)
        this.SetSelected(focus);

}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       add a new item to the list.  No check for duplicates is made
///
///  @param [in] <text> <text to show for new list item>
///
///  @return <true if there was room in the list, false otherwise>
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.AddItem = function (item_text, status_text, evtID, param, flags) {
    // find the next open item in the list and add the new one  
    for (var i = 0; i < this.trip_items_.length; i++) {
        if (!this.trip_items_[i].IsInUse()) {
            this.trip_items_[i].Set(item_text, status_text, evtID, param, flags);

            this.addChild(this.trip_items_[i]);
            return true;
        }
    }
    return false;
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       Clear items and remove them from list (but don't delete them).
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.clearListData = function () {
    for (var i = 0; i < this.trip_items_.length; i++) {
        //assert(this.trip_items_[i] != NULL);
        this.trip_items_[i].Clear();
        this.removeChild(this.trip_items_[i]);
        //this.tripList_.Unlink(this.trip_items_[i]);
    }
}
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process keypress. 
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.OnEventKeypadPush = function (Event) {
    // always pass system events to base class 
    //Pm_Widget::OnEventKeypadPush(Event);        

    // Only look for password if not currently in maintenance mode
    if (this.maintenanceMode_ == false) {
        // Check to see if key matches password 
        if (Event.param == CONST.MAINTENANCE_PASSWORD[this.keyCount_]) {
            this.keyCount_++;
        }
        else {
            this.keyCount_ = 0;
        }

        if (this.keyCount_ == CONST.MAINTENANCE_PASSWORD.length) {
            this.maintenanceMode_ = true;
            // add 'factory test' line to settings screen
            this.AddItem("Factory Test", " ", CX3_WIDGET_EVENT.FACTORY_TEST, 0, CX3_DISPLAY_UNIT_AS_VALUE);
        }
    }

    // check for 'Data Reset' (clear all memory - done using software reset)
    // Check to see if key matches data reset password 
    if (Event.param == CONST.DATARESET_PASSWORD[this.dataResetkeyCount_]) {
        this.dataResetkeyCount_++;
    }
    else {
        this.dataResetkeyCount_ = 0;
    }

    if (this.dataResetkeyCount_ == CONST.DATARESET_PASSWORD.length) {
        // Erase non-volatile memory
        UserMemEraseAll();

        // Call memory reset function     
        MemoryReset();

        /*
        #ifdef PRISM_DESKTOP_BUILD
            // Send 'memory cleared' event
            // pass event up to parent
            pm_event_t NewEvent(CX3_WIDGET_EVENT.MEMORY_CLEARED);
            NewEvent.pSource = this;
            NewEvent.Param = 0;
            NewEvent.pTarget = Parent();
            EventManager().PostTail(NewEvent);
        #endif    
        */
    }

    return 0;
}
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process 'Add Leg' event  
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.OnEventLegAdded = function (Event) {
    // Verify leg in range
    var leg = Event.param;
    if (leg < (CONST.MAX_TRIP_PLAN_LEGS + 1)) {
        // Change leg status to 'edit/review'
        this.leg_status_[leg] = TRIP_PLAN_LEG_STATUS.EDIT;

        // check for 'add' another leg
        if ((leg < CONST.MAX_TRIP_PLAN_LEGS) && (this.leg_status_[leg + 1] == TRIP_PLAN_LEG_STATUS.NONE)) {
            this.leg_status_[leg + 1] = TRIP_PLAN_LEG_STATUS.ADD;
        }

        //TODO: variable setup - copy leg variables to 'trip planner' equation screen variables
        // This is done by the equation screen class - OK unless change to single set of trip leg equations

        // send event up to parent
        this.owner.post(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_ADD, { source: this, param: leg });
        Event["handled"] = true;
        /*
        pm_event_t NewEvent(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_ADD);
        NewEvent.pSource = this;
        NewEvent.Param = leg;
        NewEvent.pTarget = Parent();
        EventManager().PostTail(NewEvent);
        */
    }
    return 0;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process 'Edit/Review Leg' event  
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.OnEventLegEdit = function (Event) {
    // Verify leg in range
    var leg = Event.param;
    if (leg < (CONST.MAX_TRIP_PLAN_LEGS + 1)) {
        //TODO: variable setup - copy leg variables to 'trip planner' equation screen variables
        // each leg has its own set of equations for now

        // send event up to parent
        this.owner.post(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_SHOW, { source: this, param: leg });
        Event["handled"] = true;
        /*
        pm_event_t NewEvent(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_SHOW);
        NewEvent.pSource = this;
        NewEvent.Param = leg;
        NewEvent.pTarget = Parent();
        EventManager().PostTail(NewEvent);
        */
    }

    return 0;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process 'Remove Leg' event  
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.OnEventLegRemoved = function (Event) {
    // Verify leg in range
    var leg = Event.param;
    var i;

    if (leg < (CONST.MAX_TRIP_PLAN_LEGS + 1)) {
        // Change leg status to 'add' (TODO: change status to 'none' if last item)
        this.leg_status_[leg] = TRIP_PLAN_LEG_STATUS.ADD;

        // Update leg status and check for:
        //  - no more than 1 'add' leg after last active leg
        //  - if not active legs, reset leg1 'add', all others inactive
        var max_active = 0;
        for (i = 1; i <= CONST.MAX_TRIP_PLAN_LEGS; i++) {
            if (this.leg_status_[i] == TRIP_PLAN_LEG_STATUS.EDIT)
                max_active = i;
        }
        // if no active legs, reset leg1 to active, rest to inactive
        if (max_active == 0) {
            max_active = 1;
            this.leg_status_[1] = TRIP_PLAN_LEG_STATUS.ADD;
            for (i = 2; i <= CONST.MAX_TRIP_PLAN_LEGS; i++)
                max_active++;  //set leg AFTER max actived leg to 'add'
            this.leg_status_[max_active] = TRIP_PLAN_LEG_STATUS.ADD;
            // and clear status of rest
            for (i = (max_active + 1); i <= CONST.MAX_TRIP_PLAN_LEGS; i++)
                this.leg_status_[i] = TRIP_PLAN_LEG_STATUS.NONE;
        }

        // send event up to parent - mainscreen will reload trip planner list
        this.owner.post(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_REMOVE, { source: this, param: leg });
        /*
        pm_event_t NewEvent(CX3_WIDGET_EVENT.TRIP_PLAN_LEG_REMOVE);
        NewEvent.pSource = this;
        NewEvent.Param = leg;
        NewEvent.pTarget = Parent();
        EventManager().PostTail(NewEvent);
        */
        // kill current focus in list
        this.activeChild = undefined;
        //i = this.tripList_.GetSelectedIndex();
        //KillFocus(this.tripList_.GetThing(i));

        // reload trip planner
        if (leg > max_active)
            leg = max_active;
        this.ShowTripPlanner(leg);
    }

    return 0;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Event callback for when the screen is unlinked from the parent (and 
///      removed from view.  This prevents multiple items from being 
///      'selected' next time the list is shown.
///
///  @param [in] <Event> <event data (id, parameters, source, etc.>
///
///  @return <always returns 0>
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.OnEventHide = function (Event) {
    //Pm_Panel::OnEventHide(Event);

    var size = this.children_.length;
    for (var i = 0; i < size; i++) {
        KillFocus(this.tripList_.GetThing(i));
    }

    return 0;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       save trip planner data to NV memory
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.SaveTripPlannerData = function () {
    // store individual leg status
    for (var i = 0; i < CONST.MAX_TRIP_PLAN_LEGS; i++) {
        nv_data_view.setUint8(NV_ADDR.TRIP.LEGS_ACTIVE + i, this.leg_status_[1 + i], true);
    }
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       recall trip planner data from NV memory
///
////////////////////////////////////////////////////////////////////////////////
TripPlannerScreen.prototype.RecallTripPlannerData = function () {
    // store individual leg status
    for (var i = 0; i < CONST.MAX_TRIP_PLAN_LEGS; i++) {
        this.leg_status_[1 + i] = nv_data_view.getUint8(NV_ADDR.TRIP.LEGS_ACTIVE + i, true);
    }
}

