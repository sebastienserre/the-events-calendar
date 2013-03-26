jQuery( document ).ready( function ( $ ) {	
	
	var tribe_is_paged = tribe_ev.fn.get_url_param('tribe_paged');	
	
	tribe_ev.state.view = 'photo';
	
	if( tribe_is_paged ) {
		tribe_ev.state.paged = tribe_is_paged;
	} 
	
	function tribe_show_loader(){		
		$('.photo-loader').show();
		$('#tribe-events-photo-events').addClass("photo-hidden");
	}
	
	function tribe_hide_loader(){		
		$('.photo-loader').hide();
		$('#tribe-events-photo-events').removeClass("photo-hidden").animate({"opacity":"1"}, {duration: 600});
	}

	function tribe_setup_isotope( $container ) {	
		if( jQuery().isotope ) {

			var tribe_not_initial_resize = false;
			var tribe_last_width = 0;
			var container_width = 0;

			$container.imagesLoaded( function(){    
				$container.isotope({
					containerStyle: {
						position: 'relative', 
						overflow: 'visible'
					}
				}, tribe_hide_loader() );
			});

			$container.resize(function() {		
				container_width = $container.width();			
				if ( container_width < 643 ) {
					$container.addClass('photo-two-col');
				} else {
					$container.removeClass('photo-two-col');				
				}

				if( tribe_not_initial_resize && container_width !== tribe_last_width ) {
					$container.isotope('reLayout');				
				}				

				tribe_not_initial_resize = true;
				tribe_last_width = container_width;
			});

		} else {
			$('#tribe-events-photo-events').removeClass("photo-hidden").css("opacity", "1");
		}
	}

	$('#tribe-events-header .tribe-ajax-loading').clone().addClass("photo-loader").appendTo('#tribe-events-content');
	
	var $container = $('#tribe-events-photo-events');	
	
	tribe_setup_isotope( $container );	
	
	if ( $container.width() < 643 ) {
		$container.addClass('photo-two-col');
	} 

	if( tribe_ev.tests.pushstate && !tribe_ev.tests.map_view() ) {	
		
		var params = 'action=tribe_photo&tribe_paged=' + tribe_ev.state.paged;

		if( tribe_ev.data.params.length ) 
			params = params + '&' + tribe_ev.data.params;		
		
		history.replaceState({									
			"tribe_params": params,
			"tribe_url_params": tribe_ev.data.params
		}, '', location.href);		

		$(window).on('popstate', function(event) {			

			var state = event.originalEvent.state;

			if( state ) {				
				tribe_ev.state.do_string = false;
				tribe_ev.state.pushstate = false;	
				tribe_ev.state.popping = true;
				tribe_ev.state.params = state.tribe_params;
				tribe_ev.state.url_params = state.tribe_url_params;
				tribe_ev.fn.pre_ajax( function() {
					tribe_events_list_ajax_post();	
				});
				
				tribe_ev.fn.set_form( tribe_ev.state.params );				
			} 
		} );		
	}

	$( 'body' ).on( 'click', 'li.tribe-nav-next a', function ( e ) {
		e.preventDefault();
		tribe_ev.state.paged++;	
		tribe_ev.state.popping = false;
		tribe_ev.fn.pre_ajax( function() { 
			tribe_events_list_ajax_post();
		});
	} ).on( 'click', 'li.tribe-nav-previous a', function ( e ) {
		e.preventDefault();
		tribe_ev.state.paged--;
		tribe_ev.state.popping = false;
		tribe_ev.fn.pre_ajax( function() {
			tribe_events_list_ajax_post();
		});
	} );

	// event bar datepicker monitoring 

	function tribe_events_bar_photoajax_actions(e) {
		if ( tribe_events_bar_action != 'change_view' ) {
			e.preventDefault();
			tribe_ev.state.paged = 1;
			tribe_ev.state.popping = false;
			tribe_ev.fn.pre_ajax( function() {
				tribe_events_list_ajax_post();
			});
		}
	}

	if( tribe_ev.tests.live_ajax() && tribe_ev.tests.pushstate ) {
		$('#tribe-bar-date').on( 'changeDate', function (e) {
			if( !tribe_ev.tests.reset_on() )
				tribe_events_bar_photoajax_actions(e)
		} );
	}

	$( '.tribe-bar-settings button[name="settingsUpdate"]' ).on( 'click', function (e) {		
		tribe_events_bar_photoajax_actions(e);
		tribe_ev.fn.hide_settings();
	} );

	$( '#tribe-bar-form' ).on( 'submit', function ( e ) {
		if ( tribe_events_bar_action != 'change_view' ) {
			tribe_events_bar_photoajax_actions(e)
		}
	} );

	tribe_ev.fn.snap( '#tribe-events-content', '#tribe-events-content', '#tribe-events-footer .tribe-nav-previous a, #tribe-events-footer .tribe-nav-next a' );
	
	$(tribe_ev.events).on("tribe_ev_runAjax", function() {
		tribe_events_list_ajax_post();		
	});

	function tribe_events_list_ajax_post() {

		tribe_show_loader();

		if( !tribe_ev.state.popping ) {			

			var tribe_hash_string = $( '#tribe-events-list-hash' ).val();

			tribe_ev.state.params = {
				action     :'tribe_photo',
				tribe_paged:tribe_ev.state.paged				
			};

			tribe_ev.state.url_params = {
				action     :'tribe_photo',
				tribe_paged:tribe_ev.state.paged				
			};							

			if( tribe_hash_string.length ) {
				tribe_ev.state.params['hash'] = tribe_hash_string;
			}
			
			$(tribe_ev.events).trigger('tribe_ev_serializeBar');

			tribe_ev.state.params = $.param(tribe_ev.state.params);
			tribe_ev.state.url_params = $.param(tribe_ev.state.url_params);

			$(tribe_ev.events).trigger('tribe_ev_collectParams');			

			tribe_ev.state.pushstate = false;
			tribe_ev.state.do_string = true;				

		}

		if( tribe_ev.tests.pushstate ) {
			
			$(tribe_ev.events).triggerAll('tribe_ev_ajaxStart tribe_ev_photoView_AjaxStart');					

			$.post(
				TribePhoto.ajaxurl,
				tribe_ev.state.params,
				function ( response ) {
					
					tribe_ev.state.paged = response.tribe_paged;
					tribe_ev.state.initial_load = false;	
					tribe_ev.fn.enable_inputs( '#tribe_events_filters_form', 'input, select' );
					
					if ( response.success ) {

                        tribe_ev.data.ajax_response = {
                            'total_count':parseInt(response.total_count),
                            'view':response.view,
                            'max_pages':response.max_pages,
                            'tribe_paged':response.tribe_paged,
                            'timestamp':new Date().getTime()
                        };

                        $(tribe_ev.events).triggerAll('tribe_ev_ajaxSuccess tribe_ev_photoView_AjaxSuccess');

						$( '#tribe-events-list-hash' ).val( response.hash );						

						$( '#tribe-events-content' ).replaceWith( response.html );
						$( '#tribe-events-content' ).prev('#tribe-events-list-hash').remove();																		

						if ( response.max_pages > tribe_ev.state.paged ) {
							$( 'li.tribe-nav-next a' ).show();
						} else {
							$( 'li.tribe-nav-next a' ).hide();
						}
						if ( tribe_ev.state.paged > 1 ) {
							$( 'li.tribe-nav-previous a' ).show();
						} else {
							$( 'li.tribe-nav-previous a' ).hide();
						}

						if( tribe_ev.state.do_string ) {														
							history.pushState({									
								"tribe_params": tribe_ev.state.params,
								"tribe_url_params": tribe_ev.state.url_params
							}, '', tribe_ev.data.cur_url + '?' + tribe_ev.state.url_params);															
						}						

						if( tribe_ev.state.pushstate ) {																
							history.pushState({									
								"tribe_params": tribe_ev.state.params,
								"tribe_url_params": tribe_ev.state.url_params
							}, '', tribe_ev.data.cur_url);
						}

						tribe_setup_isotope( $('#tribe-events-photo-events') );	
					}
				}
			);
		} else {

			if( tribe_ev.state.do_string )
				window.location = tribe_ev.data.cur_url + '?' + tribe_ev.state.url_params;													
			else
				window.location = tribe_ev.data.cur_url;			
		}
	} 	
		
});
