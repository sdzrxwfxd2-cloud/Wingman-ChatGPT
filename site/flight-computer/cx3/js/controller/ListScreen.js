///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  
//  Class Name: listScreen
//  
//   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
//  
//  Notes:
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

//#include "prism_includes.h"
//#include "calculator.h"
//#include "CX3_UI_res.h"
//#include "listScreen.h"
//#include "widgetIDs.h"
//#include "calc_utility.h"
//#include <string.h>
//
//// Fix name issues with EWL
//#ifdef _EWL_STRING_H
//#define strnlen strnlen_s
//#endif

/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
//pm_event_table_entry listScreenEvents[] = {
//  { PM_EVENT_HIDE,    PM_EVENT_HANDLER(&listScreen::OnEventHide)},
//  { 0, NULL}   /* array terminator */
//};

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default listScreen panel and creates the children.  Memory
///    is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
///  @param [in] <size> <Display size for this panel>
///
////////////////////////////////////////////////////////////////////////////////
function ListScreen() {
    Panel.call(this);
    this.addEvent("cx3-keypress", Panel.EVENTS.DEFAULT_NAVIGATION);
}
// ListScreen is a subclass of Panel:
ListScreen.inheritsFrom(Panel);

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       add a new item to the list.  No check for duplicates is made
///
///  @param [in] <text> <text to show for new list item>
///
///  @return <true if there was room in the list, false otherwise>
///
////////////////////////////////////////////////////////////////////////////////
ListScreen.prototype.addItem = function (_text, _func, _param) {
    var w = new CX3MenuItemWidget();
    w.Set(_text, _func, _param);
    this.addChild(w);
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       Clear items and remove them from list (but don't delete them).
///
////////////////////////////////////////////////////////////////////////////////
ListScreen.prototype.clear = function () {
    // Remove all references to the widgets/DOM so their resources can be released:
    for (var i in this.children_) {
        // Remove it from the DOM:
        this.removeChild(this.children_[i]);
    }
    // Clear my list of widgets:
    this.widgetList_ = [];
}
