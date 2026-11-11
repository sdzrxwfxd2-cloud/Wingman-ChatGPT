///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  
//  Class Name: memoryScreen
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
//#include "memoryScreen.h"
//#include "widgetIDs.h"
//#include "calc_utility.h"
//#include <string.h>
//#include <stdio.h>
//
//// Fix name issues with EWL
//#ifdef _EWL_STRING_H
//#define strnlen strnlen_s
//#endif
//
//using namespace CX3Calculator;
//
//namespace CX3_UI
//{

CONST.MAX_MEMORY_ITEMS = 6;

// Memory Functions:
var MEMORY_FUNCTION = {
    CLEAR: 0,
    RECALL: 1, //recall non HMS or DMS formatted value
    RECALL_TWO: 2, //recall HMS or DMS formatted value
    STORE_ONE: 3,
    ADD_ONE: 4
};

// Memory Inputs - available outside memoryScreen class
function MemoryInput() {
    this.val = 0.0;
    this.text = "";
    this.hasValue = false;
    this.allowRecall = false;
    this.hms_or_dms = false;
    this.valSet = false;
}
var MemInputOne = new MemoryInput();

/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
//pm_event_table_entry memoryScreenEvents[] = {
//
//  { PM_EVENT_HIDE,                PM_EVENT_HANDLER(&memoryScreen::OnEventHide)},
//  //{ PM_EVENT_KEYPAD_PUSH,              PM_EVENT_HANDLER(&memoryScreen::OnEventKeypadPush)},
//  { 0, NULL}   /* array terminator */
//};
//;

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default memoryScreen panel and creates the children.  Memory
///    is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
///  @param [in] <size> <Display size for this panel>
///
////////////////////////////////////////////////////////////////////////////////
function MemoryScreen() {
    Panel.call(this);
    this.output_ = 0.0;
    this.output2_ = 0.0;
    this.output_hasValue_ = false;
    this.output2_hasValue_ = false;

    // Create all the memory items:
    this.memory_items_ = [];
    for (var i = 0; i < CONST.MAX_MEMORY_ITEMS; i++) {
        this.memory_items_.push(new CX3TripItemWidget());
    }

    // Initialize output buffer - default memory value "0"
    this.outputText_ = "0";

    // Initialize output2 buffer - default memory value "00:00:00"
    this.outputTwoText_ = "00:00:00";

    // Initialize input
    MemInputOne.hasValue = false;
    MemInputOne.allowRecall = false;
    MemInputOne.text = "";
    MemInputOne.val = CONST.NO_VALUE;
    MemInputOne.valRecalled = false;
    MemInputOne.hms_or_dms = false;
    MemInputOne.valSet = false;

    this.addEvent("cx3-keypress", Panel.EVENTS.DEFAULT_NAVIGATION);
}
// MemoryScreen is a subclass of Panel:
MemoryScreen.inheritsFrom(Panel);

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clean up after ourselves and remove memory that we may have allocated.
///
////////////////////////////////////////////////////////////////////////////////
/*
memoryScreen::~memoryScreen() {
  for (unsigned int i = 0; i < ARRAY_SIZE(this.memory_items_); i++) {
    Destroy(this.memory_items_[i]);
  }

  // takes care of the list
  Destroy(this.memoryList_);
}
*/
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Displays the Memory screen
///
///
////////////////////////////////////////////////////////////////////////////////
MemoryScreen.prototype.ShowMemory = function () {

    // Clear the widget list
    this.clearListData();

    // Fill in list
    var focus = 0;

    // Recall memory/paste
    // Use output2 if input is HMS or DMS format
    if (!MemInputOne.hms_or_dms) {
        if (MemInputOne.allowRecall) {
            this.AddItem("Recall", this.outputText_, CX3_WIDGET_EVENT.MEMORY_FUNCTION, MEMORY_FUNCTION.RECALL, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
        }
        else {
            this.AddItem("Recall", this.outputText_, CX3_WIDGET_EVENT.MEMORY_FUNCTION, MEMORY_FUNCTION.RECALL,
                (WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE | WIDGET_FLAG.CX3_NON_SELECTABLE));
            focus = 1;
        }
    }
    else {
        if (MemInputOne.allowRecall) {
            this.AddItem("Recall", this.outputTwoText_, CX3_WIDGET_EVENT.MEMORY_FUNCTION, MEMORY_FUNCTION.RECALL_TWO, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
        }
        else {
            this.AddItem("Recall", this.outputTwoText_, CX3_WIDGET_EVENT.MEMORY_FUNCTION, MEMORY_FUNCTION.RECALL_TWO,
                (WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE | WIDGET_FLAG.CX3_NON_SELECTABLE));
            focus = 1;
        }

    }

    // Store Input One
    if (MemInputOne.hasValue) {
        this.AddItem("Store", MemInputOne.text, CX3_WIDGET_EVENT.MEMORY_FUNCTION, MEMORY_FUNCTION.STORE_ONE, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);
        focus = 1;
    }

    // Clear memory
    this.AddItem("Clear", " ", CX3_WIDGET_EVENT.MEMORY_FUNCTION, MEMORY_FUNCTION.CLEAR, WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE);


    // Set focus
    this.activeChild = this.children_[focus];
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       add a new item to the list.  No check for duplicates is made
///
///  @param [in] <text> <text to show for new list item>
///
///  @param [in] <item> <item number>
///
///  @return <true if there was room in the list, false otherwise>
///
////////////////////////////////////////////////////////////////////////////////
MemoryScreen.prototype.AddItem = function (item_text, status_text, evtID, param, flags) {

    // find the next open item in the list and add the new one  
  for (var i = 0; i < this.memory_items_.length; i++)
  {    
        if (!this.memory_items_[i].IsInUse()) {
            this.memory_items_[i].Set(item_text, status_text, evtID, param, flags);
            this.addChild(this.memory_items_[i]);

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
MemoryScreen.prototype.clearListData = function() 
{   
    for (var i = 0; i < this.memory_items_.length; i++) {
        this.memory_items_[i].Clear();
        this.removeChild(this.memory_items_[i]);
    }
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clear Memory
///
///  @param [in] <bool> <clear output if true, else just inputs>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
MemoryScreen.prototype.ClearMemory = function (clear_output) {
    if (clear_output) {
        // Initialize output buffer - default memory value "0"
        this.outputText_ = "0";

        // Initialize output2 buffer - default memory value "00:00:00"
        this.outputTwoText_ = "00:00:00";

        // Initialize output values (both zero)
        this.output_ = 0.0;
        this.output2_ = 0.0;
    }

    // clear input
    MemInputOne.hasValue = false;
    MemInputOne.allowRecall = false;
    MemInputOne.text = "";
    MemInputOne.val = CONST.NO_VALUE;
    MemInputOne.valRecalled = false;
    MemInputOne.hms_or_dms = false;
    MemInputOne.valSet = false;
}
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process Memory Function
///
///  @param [in] <param> <memory function>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
MemoryScreen.prototype.ProcessMemoryFunction = function (param) {
    if (param == MEMORY_FUNCTION.CLEAR) {
        this.ClearMemory(true);
    }
    else if (param == MEMORY_FUNCTION.STORE_ONE) {
        if (!MemInputOne.hms_or_dms) {
            this.outputText_ = MemInputOne.text;
            this.output_ = MemInputOne.val;
        }
        else {
            this.outputTwoText_ = MemInputOne.text;
            this.output2_ = MemInputOne.val;
        }

    }
    else if (param == MEMORY_FUNCTION.RECALL) {
        MemInputOne.text = this.outputText_;
        MemInputOne.val = this.output_;
        MemInputOne.valRecalled = true;
        if (CX3Calculator.CalculatorMemoryActive) {
            CX3Calculator.CalculatorValue = this.output_;
        }
    }
    else if (param == MEMORY_FUNCTION.RECALL_TWO) {
        MemInputOne.text = this.outputTwoText_;
        MemInputOne.val = this.output2_;
        MemInputOne.valRecalled = true;
        if (CX3Calculator.CalculatorMemoryActive) {
            CX3Calculator.CalculatorValue = this.output2_;
        }
    }
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
MemoryScreen.prototype.OnEventHide = function (Event) {
    //Pm_Panel::OnEventHide(Event);
    /*
      int size = this.memoryList_.GetNumItems();
      for (int i = 0; i < size; i++) {
        KillFocus(this.memoryList_.GetThing(i));
      }
    */
    return 0;
}
