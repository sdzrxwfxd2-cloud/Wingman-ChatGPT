
function InitializeEvents()
{
	//event handlers - mouse events
	jQuery('.flight-calculator-button').mouseover(function() {
		jQuery(this).addClass('flight-calculator-button-over');
	});

	jQuery('.flight-calculator-button').mouseout(function() {
		jQuery(this).removeClass('flight-calculator-button-over');
		jQuery('.flight-calculator-button-click').removeClass('flight-calculator-button-click');
	});
	
	jQuery('.flight-calculator-button').mousedown(function() {
		jQuery(this).addClass('flight-calculator-button-click');
	});
	
	jQuery('.flight-calculator-button').mouseup(function() {
		jQuery(this).removeClass('flight-calculator-button-click');
	});

	/*	
	//event handlers - click events
	jQuery('#btn-flt').click(function() {
		console.log('btn-flt click');
		WriteToScreen("flt");
	});
	
	jQuery('#btn-plan').click(function() {
		console.log('btn-plan click');
	});
	
	jQuery('#btn-up').click(function() {
		console.log('btn-up click');
	});
	
	jQuery('#btn-timer').click(function() {
		console.log('btn-timer click');
	});
	
	jQuery('#btn-calc').click(function() {
		console.log('btn-calc click');
	});
    
	jQuery('#btn-back').click(function() {
		console.log('btn-back click');
	});
	
	jQuery('#btn-star').click(function() {
		console.log('btn-star click');
	});
	
	jQuery('#btn-square').click(function() {
		console.log('btn-square click');
	});
	
	jQuery('#btn-wb').click(function() {
		console.log('btn-wb click');
	});
	
	jQuery('#btn-set').click(function() {
		console.log('btn-set click');
	});

	jQuery('#btn-m').click(function() {
		console.log('btn-m click');
	});
	
	jQuery('#btn-setunit').click(function() {
		console.log('btn-setunit click');
	});
	
	jQuery('#btn-down').click(function() {
		console.log('btn-down click');
	});
	
	jQuery('#btn-convunit').click(function() {
		console.log('btn-convunit click');
	});
	jQuery('#btn-divide').click(function() {
		console.log('btn-divide click');
	});
	
	jQuery('#btn-c').click(function() {
		console.log('btn-c click');
	});
	
	jQuery('#btn-7').click(function() {
		console.log('btn-7 click');
	});
	
	jQuery('#btn-8').click(function() {
		console.log('btn-8 click');
	});
	
	jQuery('#btn-9').click(function() {
		console.log('btn-9 click');
	});
	
	jQuery('#btn-x').click(function() {
		console.log('btn-x click');
	});

	jQuery('#btn-bksp').click(function() {
		console.log('btn-bksp click');
	});
	
	jQuery('#btn-4').click(function() {
		console.log('btn-4 click');
	});
	
	jQuery('#btn-5').click(function() {
		console.log('btn-5 click');
	});
	
	jQuery('#btn-6').click(function() {
		console.log('btn-6 click');
	});
	
	jQuery('#btn-minus').click(function() {
		console.log('btn-minus click');
	});

	jQuery('#btn-colon').click(function() {
		console.log('btn-colon click');
	});
	
	jQuery('#btn-1').click(function() {
		console.log('btn-1 click');
	});
	
	jQuery('#btn-2').click(function() {
		console.log('btn-2 click');
	});
	
	jQuery('#btn-3').click(function() {
		console.log('btn-3 click');
	});
	
	jQuery('#btn-plus').click(function() {
		console.log('btn-plus click');
	});

	jQuery('#btn-plusminus').click(function() {
		console.log('btn-plusminus click');
	});
	
	jQuery('#btn-decimal').click(function() {
		console.log('btn-decimal click');
	});
	
	jQuery('#btn-0').click(function() {
		console.log('btn-0 click');
	});
	
	jQuery('#btn-root').click(function() {
		console.log('btn-root click');
	});
	
	jQuery('#btn-equals').click(function() {
		console.log('btn-equals click');
	});
	
	*/
}
