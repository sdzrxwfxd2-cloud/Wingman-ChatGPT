///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: dean $
// @version $Rev: 732 $
// @date    $Date: 2012-03-07 15:47:54 -0800 (Wed, 07 Mar 2012) $
// @brief   Widget to be used in a menu list.  Elements have properties (e.g. text) and let
//      their owners know when they are 'clocked'
//

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default CX3MenuItemWidget.  
///
///  Memory is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
////////////////////////////////////////////////////////////////////////////////
function CX3MenuItemWidget() {
    Widget.call(this);
    // Create the DOM element for this widget:
    this.ui.addClass("cx3-menu-item");

    this.param_ = 0;
    this.inUse_ = false;
}
// CX3MenuItemWidget is a subclass of Widget:
CX3MenuItemWidget.inheritsFrom(Widget);

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Set the text to be shown and event info to be communicated when the 
///    item is clicked.
///
///  @param [in] <text> <text to show for new list item>
///
///  @param [in] <evt> <event to post when item is 'clicked'>
///
///  @param [in] <param> <parameter to pass with specified event>
///
////////////////////////////////////////////////////////////////////////////////
CX3MenuItemWidget.prototype.Set = function (text, evt, param) {
    // Remove old data
    this.label = text;

    // Set event data
    this.removeAllEventsNamed("cx3-keypress");
    this.addEvent("cx3-keypress", evt, false);
    this.param_ = param;

    // This item now in use.
    this.inUse_ = true;
}

Object.defineProperty(CX3MenuItemWidget.prototype, "label", {
    get: function () {
        return this.__label__;
    },
    set: function (val) {
        this.__label__ = val;
        this.fieldName.innerText = val;
        this.fieldName.textContent = val;
    }
});
/*
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process keypress.  If this is the 'enter' key, send the event up to
///    the parent for processing.
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
CX3MenuItemWidget.prototype.OnEventKeypadPush = Widget.forwardToWidget(function(Event) { 
  // make sure this is a key that we care about
  if (Event.Param == PM_KEY_CR) {
    // pass event up to parent
    pm_event_t NewEvent(this.evt_);
    NewEvent.pSource = this;
    NewEvent.Param = this.param_;
    NewEvent.pTarget = Parent();
    EventManager().PostTail(NewEvent);
  }  

  return 0; 
}
*/
