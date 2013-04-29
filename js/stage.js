/* Stage Framework 1.0 (build 2012.10.16a)
 * 
 * Aalto University School of Science,
 * Visual Media Research Group
 * 
 * Rami Alatalo
 * Copyright 2012, Licensed GPL & MIT
 * 
 * Web application framework for publishing HTML5 content.
 * 
 * The JavaScript application is launched with the init function
 * found in the main namespace stageApp. 
 * 
 * Tested and recommended versions of the required JavaScript libraries:
 * 
 * StageSwipe.js 1.0 (Modified Swipe.js)
 * jQuery 1.7.1
 * LESS 1.3.0
 * Modernizr 2.5.3
 * 
 */


/* jQuery unique function enhancement by Paul Irish.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

(function($){
	
	var _old = $.unique;
	
	$.unique = function(arr){
		
		// Do the default behavior only if we got an array of elements.
		if (!!arr[0].nodeType){
			return _old.apply(this,arguments);
		} else {
			// Reduce the array to contain no dupes via grep/inArray.
			return $.grep(arr,function(v,k){
				return $.inArray(v,arr) === k;
			});
		}
	};
})(jQuery);


/* stageApp
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var stageApp = {
	
	debug: false,
	
	resources: {
		
		/* The magazine content path relative to the web app index page. */
		content_path: "content/",
		
		/* The stand content JSON including the full path to the file. */
		stand_data: "content/stand.json",
		app_images: [
			
			/* The default stand background image should always be present as
			   the first image in this app_images list as it is used
			   dynamically for each sheet element presenting empty pages. */
			
			{ source: "img/stand-bg.png", ready: false },
			{ source: "img/ui/spinner.gif", ready: false },
			
			{ source: "img/logo-stage-fw-box.png", ready: false },
			{ source: "img/logo-retina-stage-fw-box.png", ready: false },
			
			{ source: "img/logo-aalto-small.png", ready: false },
			{ source: "img/logo-retina-aalto-small.png", ready: false},
			
			{ source: "img/ui/cog.png", ready: false },
			{ source: "svg/ui/cog.svg", ready: false },
			
			{ source: "img/ui/left.png", ready: false },
			{ source: "svg/ui/left.svg", ready: false }
			
			/* The app_images list is mainly used to detect when all the
			   necessary user interface images are loaded and the web app
			   ready to be launched at full scale. SVG resources cannot be
			   tested cross browser as Opera will not allow them to be
			   used in img tags. */
		]
	},
	
	/* Stand view object. -- #stand */
	stand: {
		json: null,
		scroll: 0,
		launched: 0,
		loaded: 0
	},
	
	/* Stage view object. -- #stage */
	stage: {
		instance: null,				// Stage.js Stage instance.
		
		issue: null,				// Current extended issue identifier.
		magazine_identifier: null,	// Current magazine identifier.
		issue_identifier: null,		// Current issue identifier.
		
		pages: 0,					// Page count of the current issue.
		page: 0,					// Current page the user is viewing.
		scripts: {},
		
		issue_launched: false,		// First page load requested.
		loaded: [],					// Preloaded pages container.
		
		/* Stage content rendering engines. */
		engines: {
			
			/* Test content engine. */
			test: {
				available: true
			},
			
			/* Sandbox engine loads prerendered HTML5 content to frames which
			   users cannot interact with (excluding video and audio). */
			sandbox: {
				available: true
			},
			
			/* Inclusion engine loads prerendered HTML5 content and includes
			   it to the same DOM with the web app. */
			inclusion: {
				available: true
			},
			
			/* TODO: Live engine generates the HTML5 content on the fly based
			   on the given JSON input and resources listed in there. */
			live: {
				available: true
			},
			
			fallback: 'inclusion'
		},
		start: 0,
		end: 0
	},
	
	/* Curtain view (black overlay) object. -- #curtain */
	curtain: {},
	
	/* General binding functions. */
	binders: {},
	
	/* Web app caching engines. */
	cache: {
		webStorage: {
			available: false
		},
		applicationCache: {
			available: false
		},
		cookies: {
			available: false
		}
	},
	
	/* General helper functions. */
	tools: {}
	
};

stageApp.init = function() {
	
	stageApp.tools.toggleLogging(stageApp.debug);
	
	stageApp.cache.webStorage.detect();
	stageApp.cache.applicationCache.detect();
	stageApp.cache.applicationCache.toggleDebug(stageApp.cache.applicationCache.available && stageApp.debug);
	stageApp.cache.cookies.detect();
	
	console.log("HTML5 Web Storage available: " + stageApp.cache.webStorage.available);
	console.log("HTML5 Application Cache available: " + stageApp.cache.applicationCache.available);
	console.log("Cookies are available: " + stageApp.cache.cookies.available);
	
	stageApp.cache.applicationCache.clearCachedResources();
	
	stageApp.curtain.paralyze();
	
	stageApp.binders.windowOrientationChange();
	stageApp.binders.windowResize();
	stageApp.binders.userInterface();
	
	stageApp.stage.paralyze();
	stageApp.stage.render();
	stageApp.stand.render();
	stageApp.stand.premiere();
	
	console.log("Stage Framework loaded.");
	
}

stageApp.stand.render = function() {
	
	stageApp.stand.render.updateShadow = function() {
		
		$('#stand .shadow').css('minHeight', $(window).height() + 60);
		
	};
	
	stageApp.stand.render.dividerMarkup = function(identifier, title) {
		
		var wrapper = $('<span/>', {
			id: identifier,
			class: 'divider'
		});
		
		$('<span/>', {
			class: 'title',
			text: title
		}).appendTo(wrapper);
		
		wrapper.appendTo('#stand .content');
		
	};
	
	stageApp.stand.render.issueMarkup = function(identifier, title, parent_identifier, pages, index, parent_index) {
		
		var issue = $('<a/>', {
			id: parent_identifier + '-' + identifier,
			class: 'issue',
			href: '#'
		});
		issue.data('pages', pages);
		issue.data('magazine-index', parent_index);
		issue.data('issue-index', index);
		
		$('<div/>', { class: 'aspect-ratio' }).appendTo(issue);
		$('<div/>', { class: 'cover' }).appendTo(issue);
		
		var info = $('<div/>', { class: 'info' });
		
		$('<div/>', { class: 'title', text: title }).appendTo(info);
		
		issue.append(info);
		
		var wide_spinner = $('<div/>', {
			class: 'spinner wide-spinner'
		});
		var small_spinner = $('<div/>', {
			class: 'spinner small-spinner'
		});
		wide_spinner.appendTo(issue);
		small_spinner.appendTo(issue);
		
		issue.insertAfter('#' + parent_identifier);
		
	};
	
	stageApp.stand.render.issueStyles = function(identifier, parent_identifier, covers) {
		
		var styles = "";
		var generated_identifier = parent_identifier + '-' + identifier;
		var cover_path = stageApp.resources.content_path + parent_identifier + '/' + identifier + '/';
		
		/* The default issue cover style uses the highest available picture quality. */
		if (covers.small) {
			styles +=
			'#' + generated_identifier + ' .cover {\n' + 
			'	background-image: url("' + cover_path + covers.small + '");\n' +
			'}\n';
		}
		
		/* The small quality cover style is by default meant for device resolution widths of 1024px and above. */
		if (covers.medium) {
			styles +=
			'@media screen and (min-width: 1024px) and (-webkit-min-device-pixel-ratio: 1),\n' +
			'		screen and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1.5),\n' +
			'		screen and (min-width: 512px) and (-webkit-min-device-pixel-ratio: 2) {\n' +
			'	#' + generated_identifier + ' .cover {\n' +
			'		background-image: url("' + cover_path + covers.medium + '");\n' +
			'	}\n' +
			'}\n'
		}
		
		/* The medium quality cover style is by default meant for device resolution widths of 2048px and above. */
		if (covers.high) {
			styles +=
			'@media screen and (min-width: 2048px) and (-webkit-min-device-pixel-ratio: 1),\n' +
			'		screen and (min-width: 1536px) and (-webkit-min-device-pixel-ratio: 1.5),\n' +
			'		screen and (min-width: 1024px) and (-webkit-min-device-pixel-ratio: 2) {\n' +
			'	#' + generated_identifier + ' .cover {\n' +
			'		background-image: url("' + cover_path + covers.high + '");\n' +
			'	}\n' +
			'}\n';
		}
		
		var style = document.createElement('style');
		style.type = 'text/css';
		style.className = 'cover-style';
		
		if (style.styleSheet) {
			style.styleSheet.cssText = styles;
		} else {
			style.appendChild(document.createTextNode(styles));
		}
		
		document.getElementsByTagName('head')[0].appendChild(style);
		
	};
	
	stageApp.stand.launched = +new Date();
	stageApp.stand.render.updateShadow();
	
	var standXHR = $.getJSON(stageApp.resources.stand_data);
	
	standXHR.success(function(data) {
		
		stageApp.stand.json = data;
		
		/* If different stand update date, store the newly fetched stand data. */
		if (stageApp.cache.webStorage.available && stageApp.cache.webStorage.getStandDate() != data.updated) {
			stageApp.cache.webStorage.storeStand(data);
		}
		
		/* Use the fresh stand data, client online. */
		$.each(data.content, function(index, value) {
			
			var parent = this;
			var parent_index = index;
			stageApp.stand.render.dividerMarkup(this.identifier, this.title);
			
			$.each(this.issues, function(index, value) {
				
				stageApp.stand.render.issueStyles(this.identifier, parent.identifier, this.covers);
				stageApp.stand.render.issueMarkup(this.identifier, this.title, parent.identifier, this.pages.length, index, parent_index);
				
			});
		});
		
	});
	
	standXHR.error(function() {
		
		if (stageApp.cache.webStorage.available && stageApp.cache.webStorage.getStandDate() != null) {
			
			/* Cached stand data present and client offline. */
			stageApp.stand.json = stageApp.cache.webStorage.loadStand();
			
			$.each(stageApp.stand.json.content, function(index, value) {
				
				var parent = this;
				var parent_index = index;
				stageApp.stand.render.dividerMarkup(this.identifier, this.title);
				
				$.each(this.issues, function(index, value) {
					
					stageApp.stand.render.issueStyles(this.identifier, parent.identifier, this.covers);
					stageApp.stand.render.issueMarkup(this.identifier, this.title, parent.identifier, this.pages.length, index, parent_index);
					
				});
			});
			
		} else {
			
			/* No cached stand data and client offline. */
			
		}
		
	});
	
};

stageApp.stand.premiere = function() {
	
	stageApp.stand.premiere.coverImages = function() {
		var load_interval = setInterval(function() {
			var coverCount = $('.cover').not('.ready').length;
			$('.cover').not('.ready').each(function(i, value) {
				if ($(this).hasClass('loading')) {
					return false;
				}
				if (i == coverCount - 1) {
					clearInterval(load_interval);
					stageApp.stand.loaded = +new Date();
				}
				var image = new Image();
				var instance = this;
				$(image).load(function() {
					$(instance).parent().css('backgroundImage', 'none');
					$(instance).parent().children('.spinner').css('opacity', 0);
					setTimeout(function() {
						$(instance).parent().children('.spinner').hide();
					}, 250);
					$(instance).css('opacity', 1);
					setTimeout(function() {
						$(instance).removeClass('loading');
						$(instance).addClass('ready');
					}, 250);
				});
				$(instance).addClass('loading');
				image.src = $(this).css('backgroundImage').replace('url(', '').replace(')', '').split('"').join('').split("'").join('');
				return false;
			});
		}, 400);
	};
	
	var requested = 0;
	var returned = 0;
	$.each(stageApp.resources.app_images, function(index, value) {
		if (typeof this == 'undefined' || typeof this.source == 'undefined') {
			stageApp.resources.app_images.splice(index, 1);
			return;
		}
		if (!$('html').hasClass('svg')) {
			var split = this.source.split('.');
			if (split[split.length - 1] == 'svg') {
				stageApp.resources.app_images.splice(index, 1);
				return;
			}
		}
		var image = new Image();
		var instance = this;
		$(image).load(function() {
			returned++;
			instance.ready = true;
			var done = true;
			$.each(stageApp.resources.app_images, function() {
				if (!this.ready) {
					done = false;
					return;
				}
			});
			if (done || returned == requested) {
				$('#stand').show();
				if (stageApp.stand.scroll) {
					$(window).scrollTop(stageApp.stand.scroll);
				} else {
					if (!$(window).scrollTop()) {
						setTimeout(function() {
							window.scrollTo(0, 1);
						}, 0);
					}
				}
				$('#curtain').css('opacity', 0.99);
				setTimeout(function() {
					$('#curtain').css('opacity', 0);
					setTimeout(function() {
						$('#curtain').hide();
						stageApp.stand.premiere.coverImages();
					}, 500);
				}, 2000);
			}
		});
		requested++;
		image.src = this.source;
	});
	
};

stageApp.stage.render = function() {
	
	stageApp.stage.instance = new Stage(document.getElementById('stage'));
	
	/*
	$('#stage .container').click(function() {
		stageApp.stage.instance.next();
		return false;
	});
	*/
	
	$('#stage').bind('webkitTransitionEnd msTransitionEnd oTransitionEnd transitionend', function(e) {
		if (e.target.className == 'viewport') {
			var i = stageApp.stage.instance.getPos();
			$('.sheet').removeClass('active');
			$('.sheet').eq(i).addClass('active');
			if (stageApp.stage.issue_launched) {
				stageApp.stage.loadPage(i + 1);
			} else {
				stageApp.stage.issue_launched = true;
			}
		}
	});
	
};

stageApp.stage.loadIssue = function(extended_issue_identifier) {
	
	stageApp.stage.start = +new Date();
	var stand_element = $('#' + extended_issue_identifier);
	var magazine_index = stand_element.data('magazine-index');
	var issue_index = stand_element.data('issue-index');
	
	if (stageApp.stage.issue == extended_issue_identifier) {
		return;
	}
	stageApp.stage.issue = extended_issue_identifier;
	stageApp.stage.magazine_identifier = stageApp.stand.json.content[magazine_index].identifier;
	stageApp.stage.issue_identifier = stageApp.stand.json.content[magazine_index].issues[issue_index].identifier;
	console.log("New issue requested: " + extended_issue_identifier);
	
	$('#stage .viewport').html('');
	
	var viewport = $('<div/>', {
		class: 'viewport',
	});
	
	stageApp.stage.pages = parseInt(stand_element.data('pages')) ? parseInt(stand_element.data('pages')) : 1;
	stageApp.stage.page = 0;
	
	var pages_with_paths = [];
	
	for (var i = 0; i < stageApp.stage.pages; i++) {
		
		var container = $('<div/>', {
			id: !i ? 'front' : '',
			class: 'container',
			role: 'main',
			style: !i ? 'display: block;' : 'display: none;'
		});
		
		var sheet = $('<div/>', {
			class: 'sheet ' + stageApp.stage.engines.fallback, // TODO: Get the content render mode from the JSON.
			rel: stageApp.stand.json.content[magazine_index].issues[issue_index].pages[i]
		});
		sheet.appendTo(container);
		
		container.appendTo(viewport);
		pages_with_paths.push(stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + stageApp.stand.json.content[magazine_index].issues[issue_index].pages[i]);
	}
	
	stageApp.cache.applicationCache.requestResources(pages_with_paths);
	
	$('#stage .viewport').html($(viewport).html());
	
};

stageApp.stage.unloadIssue = function() {
	
	for (var i = 0; i < stageApp.stage.loaded.length; i++) {
		var page_number = stageApp.stage.loaded.pop();
		if (stageApp.stage.isValidPage(page_number)) {
			$('#stage .sheet').eq(page_number - 1).css('background', 'none');
			$('#stage .sheet').eq(page_number - 1).css('opacity', 0);
			$('#stage .sheet').eq(page_number - 1).html('');
			var index = $.inArray(page_number, stageApp.stage.loaded)
			if (index > -1) {
				stageApp.stage.loaded.splice(index, 1);
			}
		}
	}
	
	$('#stage .viewport').html('');
	
	stageApp.stage.issue = null;
	stageApp.stage.magazine_identifier = null;
	stageApp.stage.issue_identifier = null;
	stageApp.stage.pages = 0;
	stageApp.stage.page = 0;
	stageApp.stage.loaded = [];
	stageApp.stage.scripts = {};
	stageApp.stage.issue_launched = false;
	stageApp.stage.instance.hideScrollIndicator();
	
	$('body > *').not('#stage, #return, #stand, #curtain, script').remove();
	$('#wrapper').remove();
	
	stageApp.cache.applicationCache.clearCachedResources();
	stageApp.stage.end = +new Date();
		
};

stageApp.stage.loadPage = function(page_number) {
	
	stageApp.stage.loadPage.fadeIn = function(sheet_element, delay) {
		
		/*if (sheet_element.hasClass('cached')) {
			sheet_element.parent().children('.cloack, .spinner').remove();
			return;
		}*/
		
		if (parseInt(delay)) {
			delay = parseInt(delay);
		} else {
			delay = 0;
		}
		
		if (!stageApp.stage.issue_launched) {
			delay = delay + 1000;
		}
		
		sheet_element.css('opacity', 1);
		
		sheet_element.parent().children('.cloack').addClass('animating')
					 .css('transition', 'opacity 0s linear')
					 .css('webkitTransition', 'opacity 0s linear')
					 .css('mozTransition', 'opacity 0s linear')
					 .css('oTransition', 'opacity 0s linear')
					 .css('khtmlTransition', 'opacity 0s linear')
					 .css('msTransition', 'opacity 0s linear')
					 .css('opacity', 0.99);
		
		setTimeout(function() {
			sheet_element.parent().children('.cloack').children('.spinner')
						 .css('transition', 'opacity 0.25s linear')
						 .css('webkitTransition', 'opacity 0.25s linear')
						 .css('mozTransition', 'opacity 0.25s linear')
						 .css('oTransition', 'opacity 0.25s linear')
						 .css('khtmlTransition', 'opacity 0.25s linear')
						 .css('msTransition', 'opacity 0.25s linear')
						 .css('opacity', 0);
		}, 250 + delay);
		
		setTimeout(function() {
			sheet_element.parent().children('.cloack').addClass('animating')
						 .css('transition', 'opacity 0.75s linear')
						 .css('webkitTransition', 'opacity 0.75s linear')
						 .css('mozTransition', 'opacity 0.75s linear')
						 .css('oTransition', 'opacity 0.75s linear')
						 .css('khtmlTransition', 'opacity 0.75s linear')
						 .css('msTransition', 'opacity 0.75s linear')
						 .css('opacity', 0);
			setTimeout(function() {
				sheet_element.parent().children('.cloack, .spinner').remove();
			}, 750);
		}, 750 + delay);
		
		var scripts = stageApp.stage.scripts[sheet_element.attr('id')];
		stageApp.stage.engines.inclusion.applyScripts(scripts);
		stageApp.stage.scripts[sheet_element.attr('id')] = [];
		
	};
	
	stageApp.stage.loadPage.applyDefaultBackground = function(sheet_element) {
		
		if (!sheet_element.hasClass('cached') && !(sheet_element.children('.frame').length > 0 && sheet_element.children('.frame').first().hasClass('cached'))) {
			
			if (!sheet_element.parent().children('.cloack').length) {
				var cloack = $('<div/>', {
					class: 'cloack'
				});
				cloack.appendTo(sheet_element.parent());
				sheet_element.parent().children('.cloack').css('background', 'black');
				sheet_element.parent().children('.cloack').bind('touchmove mousemove', function() {
					return false;
				});
			}
			
			if (!sheet_element.parent().children('.cloack').children('.spinner').length) {
				var wide_spinner = $('<div/>', {
					class: 'spinner wide-spinner'
				});
				var small_spinner = $('<div/>', {
					class: 'spinner small-spinner'
				});
				// Moved spinners from the sheet parent to the cloack element. (APR13)
				wide_spinner.appendTo(sheet_element.parent().children('.cloack'));
				small_spinner.appendTo(sheet_element.parent().children('.cloack'));
				
				setTimeout(function() {
				small_spinner.css('transition', 'opacity 0.25s linear')
							 .css('webkitTransition', 'opacity 0.25s linear')
							 .css('mozTransition', 'opacity 0.25s linear')
							 .css('oTransition', 'opacity 0.25s linear')
							 .css('khtmlTransition', 'opacity 0.25s linear')
							 .css('msTransition', 'opacity 0.25s linear');
				small_spinner.css('opacity', 0.9);
				}, 50);
			}
		}
		
		if ($('.sheet').length == 1) {
			sheet_element.css('background', 'url("' + stageApp.resources.app_images[0].source + '")');
		} else {
			sheet_element.css('background', 'white');
		}
		
	};
	
	stageApp.stage.loadPage.callEngine = function(sheet_element, fade_in) {
		
		if (sheet_element.hasClass('sandbox')) {
			stageApp.stage.engines.generatePage('sandbox', sheet_element, fade_in);
		} else if (sheet_element.hasClass('inclusion')) {
			//stageApp.stage.engines.inclusion.preloadPage(sheet_element); // TODO
			stageApp.stage.engines.generatePage('inclusion', sheet_element, fade_in);
		} else if (sheet_element.hasClass('live')) {
			stageApp.stage.engines.generatePage('live', sheet_element, fade_in);
		} else if (sheet_element.hasClass('test')) {
			stageApp.stage.engines.generatePage('live', sheet_element, fade_in);
		} else {
			if (fade_in) {
				stageApp.stage.loadPage.fadeIn(sheet_element, 0);
			}
		}
		
	};
	
	var old = {
		active: stageApp.stage.page,
		previous: stageApp.stage.page - 1,
		next: stageApp.stage.page + 1
	}
	
	if (!page_number) {
		page_number = 1;
		if (stageApp.cache.webStorage.available) {
			var active_page = parseInt(stageApp.cache.webStorage.loadIssue.activePage(stageApp.stage.issue));
			if (active_page) {
				page_number = active_page;
			}
		}
	}
	
	stageApp.stage.page = page_number;
	
	var current = {
		active: stageApp.stage.page,
		previous: stageApp.stage.page - 1,
		next: stageApp.stage.page + 1
	}
	
	if (old.active != current.active && old.active != current.previous && old.active != current.next) {
		stageApp.stage.unloadPage(old.active);
	}
	
	if (old.next != current.active && old.next != current.previous && old.next != current.next) {
		stageApp.stage.unloadPage(old.next);
	}
	
	if (old.previous != current.active && old.previous != current.previous && old.previous != current.next) {
		stageApp.stage.unloadPage(old.previous);
	}
	
	var sheets = $('#stage .sheet');
	
	if ($.inArray(current.active, stageApp.stage.loaded) < 0) {
		if (stageApp.stage.isValidPage(current.active)) {
			stageApp.stage.loadPage.applyDefaultBackground(sheets.eq(current.active - 1));
			stageApp.stage.loadPage.callEngine(sheets.eq(current.active - 1), true);
			stageApp.stage.loaded.push(current.active);
		}
	} else {
		var fadeInTester = setInterval(function() {
			var sheet_frames = sheets.eq(current.active - 1).children('.frame');
			if (sheet_frames.length > 0) {
				var sheet_frame = sheet_frames.first();
				if (!sheet_frame.hasClass('cached')) {
					return;
				}
			}
			stageApp.stage.loadPage.fadeIn(sheets.eq(current.active - 1), 0);
			clearInterval(fadeInTester);
		}, 250);
	}
	
	if ($.inArray(current.next, stageApp.stage.loaded) < 0) {
		if (stageApp.stage.isValidPage(current.next)) {
			stageApp.stage.loadPage.applyDefaultBackground(sheets.eq(current.next - 1));
			stageApp.stage.loadPage.callEngine(sheets.eq(current.next - 1), false);
			stageApp.stage.loaded.push(current.next);
		}
	}
	
	if ($.inArray(current.previous, stageApp.stage.loaded) < 0) {
		if (stageApp.stage.isValidPage(current.previous)) {
		stageApp.stage.loadPage.applyDefaultBackground(sheets.eq(current.previous - 1));
			stageApp.stage.loadPage.callEngine(sheets.eq(current.previous - 1), false);
			stageApp.stage.loaded.push(current.previous);
		}
	}
	
	stageApp.stage.instance.update();
	
	if (stageApp.cache.webStorage.available) {
		stageApp.cache.webStorage.storeIssue.activePage(stageApp.stage.issue, current.active);
	}
	
};

stageApp.stage.unloadPage = function(page_number) {
	
	if (page_number < 1 || !stageApp.stage.issue_launched) {
		return;
	}
	
	console.log("Unload of page number " + page_number + " called.");
	
	stageApp.stage.unloadPage.unloadSandbox = function(sheet_element) {
		
		if (sheet_element.children('.frame').length > 0) {
			var sandbox_contents = sheet_element.children('.frame').first().contents();
			sandbox_contents.find('video audio img script').each(function() {
				this.src = '';
			});
			sandbox_contents.find('*').each(function() {
				$(this).css('backgroundImage', 'none');
			});
			sandbox_contents.find('link').each(function() {
				this.href = '';
			});
		}
		
	};
	
	stageApp.stage.unloadPage.unloadInclusion = function(sheet_element) {
		
		var inclusion_contents = sheet_element.find('*');
		inclusion_contents.find('video audio img script').each(function() {
			this.src = '';
		});
		inclusion_contents.each(function() {
			$(this).css('backgroundImage', 'none');
		});
		inclusion_contents.find('link').each(function() {
			this.href = '';
		});
		inclusion_contents.die();
		
		console.log("Unloaded " + $('.' + sheet_element.attr('id')).length + " stylesheets of " + sheet_element.attr('id') + ".");
		$('.' + sheet_element.attr('id')).remove();
		
	};
	
	if (stageApp.stage.isValidPage(page_number)) {
		
		var index = $.inArray(page_number, stageApp.stage.loaded)
		
		if (index > -1) {
			stageApp.stage.loaded.splice(index, 1);
			
			var sheet_element = $('#stage .sheet').eq(page_number - 1);
			
			if (sheet_element.hasClass('sandbox')) {
				stageApp.stage.unloadPage.unloadSandbox(sheet_element);
			}
			if (sheet_element.hasClass('inclusion')) {
				stageApp.stage.unloadPage.unloadInclusion(sheet_element);
			}
			
			// Removes the spinners now from the cloack element. (APR13)
			sheet_element.parent().children('.cloack').children('.spinner').remove();
			
			sheet_element.parent().children('.cloack').css('background', 'black');
			sheet_element.parent().children('.spinner').remove();
			sheet_element.parent().children('.cloack').remove();
			sheet_element.removeClass('cached');
			sheet_element.css('background', 'none');
			sheet_element.css('opacity', 0);
			sheet_element.html('');
			sheet_element.attr('id', '');
		}
		
	}
	
};

stageApp.stage.isValidPage = function(page_number) {
	
	if (isNaN(page_number)) {
		return false;
	} else {
		if (page_number > 0 && page_number < stageApp.stage.pages + 1) {
			return true;
		} else {
			return false;
		}
	}
	
};

stageApp.stage.paralyze = function() {
	
	$('#stage').live('touchmove mousewheel', function(e) {
		e.preventDefault();
	});
	
};

stageApp.curtain.paralyze = function() {
	
	$('#curtain').live('touchmove mousewheel', function(e) {
		e.preventDefault();
	});
	
};

stageApp.stage.engines.generatePage = function(engine, sheet_element, fade_in) {
	
	console.log("Page generation for the sheet " + sheet_element.attr('rel') + " started with a timestamp: " + Math.round(+new Date()/1000));
	
	switch (engine) {
		case 'test':
			if (stageApp.stage.engines.test.available) {
				stageApp.stage.engines.test.generatePage(sheet_element);
			}
			break;
		case 'sandbox':
			if (stageApp.stage.engines.sandbox.available) {
				stageApp.stage.engines.sandbox.generatePage(sheet_element, fade_in);
			}
			break;
		case 'inclusion':
			if (stageApp.stage.engines.inclusion.available) {
				stageApp.stage.engines.inclusion.generatePage(sheet_element, fade_in);
			}
			break;
		case 'live':
			if (stageApp.stage.engines.test.available) {
				stageApp.stage.engines.test.generatePage(sheet_element, fade_in);
			}
			break;
		default:
			if (stageApp.stage.engines[stageApp.stage.engines.fallback].available) {
				stageApp.stage.engines[stageApp.stage.engines.fallback].generatePage(sheet_element, fade_in);
			}
			break;
	}
	
};

stageApp.stage.engines.test.generatePage = function(sheet_element, fade_in) {
	
	var test_content = ['1', '2<br />2', '3<br />3<br />3'];
	sheet_element.html(test_content[Math.floor(Math.random() * test_content.length)]);
	stageApp.stage.loadPage.fadeIn(sheet_element, 0);
	
};

stageApp.stage.engines.sandbox.generatePage = function(sheet_element, fade_in) {
	
	var page_id = stageApp.stage.magazine_identifier + '-' + stageApp.stage.issue_identifier + '-' + sheet_element.attr('rel').replace('.html', '');
	
	sheet_element.attr('id', page_id);
	
	var frame = $('<iframe/>', {
		class: 'frame',
		src: stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + sheet_element.attr('rel')
	});
	frame.load(function() {
		
		var tags = frame.contents().find('*');
		var img_tags = tags.find('img');
		var posters = tags.find('[poster]');
		var images = [];
		
		$.each(img_tags, function() {
			//if ($(this).attr('src').indexOf('.svg') < 0) { // TODO: svg
				images.push($(this).attr('src'));
			//}
		});
		
		$.each(posters, function() {
			//if ($(this).attr('poster').indexOf('.svg') < 0) { // TODO: svg
				images.push($(this).attr('poster'));
			//}
			//if ($(this).attr('ios-portrait-poster').indexOf('.svg') < 0) {
				images.push($(this).attr('poster'));
			//}
			//if ($(this).attr('ios-landscape-poster').indexOf('.svg') < 0) {
				images.push($(this).attr('poster'));
			//}
		});
		
		for (var i = 0; i < tags.length; i++) {
			el = tags.get(i);
			if (el.currentStyle) {
				if (el.currentStyle['backgroundImage'] !== 'none') {
					var value = el.currentStyle['backgroundImage'].replace('url(', '').replace(')', '').split('"').join('').split("'").join('');
					var temp = value.split('/');
					if (temp[temp.length - 1] != 'undefined') {
						images.push(value);
					}
				}
			} else if (window.getComputedStyle) {
				if (document.defaultView.getComputedStyle(el, null).getPropertyValue('background-image') !== 'none') {
					var value = document.defaultView.getComputedStyle(el, null).getPropertyValue('background-image').replace('url(', '').replace(')', '').split('"').join('').split("'").join('');
					var temp = value.split('/');
					if (temp[temp.length - 1] != 'undefined') {
						images.push(value);
					}
				}
			}
		}
		
		var instances = []
		if (images.length) {
			images = $.unique(images);
		}
		$.each(images, function(index, value) {
			instances[index] = {}
			instances[index].source = this;
		});
		
		if (typeof instances == 'undefined' || !instances.length) {
			setTimeout(function() {
				var min_height = frame.contents().height() + 100;
				frame.css('height', min_height + 'px');
				frame.parent().css('height', min_height + 'px');
				
				if (frame.contents().find('title').html().indexOf('404') > -1) {
					sheet_element.html('');
				}
				
				stageApp.stage.instance.update();
				
			}, 1000);
			
			if (fade_in) {
				
				var delay = 0;
				
				if (images.length + img_tags.length > 10) {
					delay = 1000;
				} else if (images.length + img_tags.length > 5) {
					delay = 500;
				}
				
				stageApp.stage.loadPage.fadeIn(sheet_element, delay);
			} else {
				sheet_element.css('opacity', 1);
			}
			//sheet_element.parent().children('.cloack, .spinner').remove();
			sheet_element.parent().children('.cloack').css('opacity', 0.99);
			sheet_element.addClass('cached');
			frame.addClass('cached');
		}
		
		var returned = 0;
		$.each(images, function(index, value) {
			var image = new Image();
			var instance = instances[index];
			$(image).load(function() {
				returned++;
				instance.ready = true;
				if (returned == instances.length) {
					
					setTimeout(function() {
						var min_height = frame.contents().height() + 100;
						frame.css('height', min_height + 'px');
						frame.parent().css('height', min_height + 'px');
						
						if (frame.contents().find('title').html().indexOf('404') > -1) {
							sheet_element.html('');
						}
						
						stageApp.stage.instance.update();
						
					}, 1000);
					
					if (fade_in) {
						
						var delay = 0;
						
						if (images.length + img_tags.length > 10) {
							delay = 1000;
						} else if (images.length + img_tags.length > 5) {
							delay = 500;
						}
						
						stageApp.stage.loadPage.fadeIn(sheet_element, delay);
					} else {
						sheet_element.css('opacity', 1);
					}
					//sheet_element.parent().children('.cloack, .spinner').remove();
					sheet_element.parent().children('.cloack').css('opacity', 0.99);
					sheet_element.addClass('cached');
					frame.addClass('cached');
				}
			});
			image.src = instance.source;
		});
		
	});
	
	frame.appendTo(sheet_element);
	
};

stageApp.stage.engines.inclusion.preloadPage = function(sheet_element) {
	
	stageApp.stage.engines.inclusion.preloadPage.prepare = function(data, sheet_element) {
		
		if (typeof data != 'string') {
			data = '';
		}
		
		/* Note: The page ID takes just the first part of the file name when split with a dot.
		   An example of a page ID: magazine-2012-11-index. */
		var page_id = stageApp.stage.magazine_identifier + '-' + stageApp.stage.issue_identifier + '-' + sheet_element.attr('rel').split('.')[0];
		
		var scripts = [];
		
		var styles = {
			css: [],
			less: []
		};
		
		var html = {
			opening: '',
			classes: [],
			id: ''
		};
		var body = {
			opening: '',
			classes: [],
			id: ''
		};
		
		var dom = $(data);
		
		/* Get the scripts from the loaded content. */
		if (!dom.filter('script').length) {
			
			/* TODO: The following loads also commented out stylesheets and scripts. */
			
			/* For Android browser we can't use the fetched data as parsed jQuery object. */
			if (data.indexOf('<script') > -1) {
				var scripts_temp = data.match(/<script[^>]*(.*?)>/g);
				for (var i = 0; i < scripts_temp.length; i++) {
					var src = '';
					if (scripts_temp[i].indexOf(' src') > -1) {
						src = scripts_temp[i].match(/src=['\"](.*?)['\"]/i)[1];
						if (src.indexOf('//') < 0) {
							scripts.push(src);
						}
					}
				}
			}
		
		} else {
			
			dom.filter('script').each(function() {
				scripts.push(this.src);
			});
			
		}
		
		/* Get the regular and LESS stylesheets. */
		if (!dom.filter('link').length) {
			
			/* TODO: The following loads also commented out stylesheets and scripts. */
			
			/* For Android browser we can't use the fetched data as parsed jQuery object. */
			if (data.indexOf('<link') > -1) {
				var links = data.match(/<link[^>]*(.*?)>/g);
				for (var i = 0; i < links.length; i++) {
					var rel = '';
					var href = '';
					if (links[i].indexOf(' rel') > -1) {
						rel = links[i].match(/rel=['\"](.*?)['\"]/i)[1];
					}
					if (rel == 'stylesheet') {
						if (links[i].indexOf(' href') > -1) {
							href = links[i].match(/href=['\"](.*?)['\"]/i)[1];
						}
						if (href != '') {
							styles.css.push(href);
						}
					} else if (rel == 'stylesheet/less') {
						if (links[i].indexOf(' href') > -1) {
							href = links[i].match(/href=['\"](.*?)['\"]/i)[1];
						}
						if (href != '') {
							styles.less.push(href);
						}
					}
				}
			}
			
		} else {
			
			dom.filter('link').each(function() {
				if (this.rel == 'stylesheet') {
					styles.css.push(stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + this.href.replace(window.location, ''));
				} else if (this.rel == 'stylesheet/less') {
					styles.less.push(stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + this.href.replace(window.location, ''));
				}
			});
			
		}
		
		/* Get the opening tags for html and body respectively. */
		if (data.indexOf('<html') > -1) {
			html.opening = data.match(/<html[^>]*(.*?)>/i)[0];
		}
		if (data.indexOf('<body') > -1) {
			body.opening = data.match(/<body[^>]*(.*?)>/i)[0];
		}
		
		if (html.opening.indexOf(' class') > -1) {
			html.classes = html.opening.match(/class=['\"](.*?)['\"]/i)[1];
		}
		if (body.opening.indexOf(' class') > -1) {
			body.classes = body.opening.match(/class=['\"](.*?)['\"]/i)[1];
		}
		if (html.opening.indexOf(' id') > -1) {
			html.id = html.opening.match(/id=['\"](.*?)['\"]/i)[1];
		}
		if (body.opening.indexOf(' id') > -1) {
			body.id = body.opening.match(/id=['\"](.*?)['\"]/i)[1];
		}
		
		/* Total count of stylesheets. */
		var stylesheets = styles.css.length + styles.less.length;
		
		if (!stylesheets) {
			stageApp.stage.engines.inclusion.generatePage.finalize(data, html, body, sheet_element, fade_in, scripts, page_id);
		}
		
		/* Process the regular stylesheets. */
		$.each(styles.css, function(index, value) {
			
			if (!(this.indexOf('//') > -1 && this.indexOf(window.location) < 0)) {
				var new_path = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/';
				if (this.indexOf(new_path) < 0) {
					styles.css[index] = new_path + this.replace(window.location, '');
				}
			}
			
			//$('head').append('<link rel="stylesheet" href="' + this + '" class="' + page_id + '" />');
			
			$.get(styles.css[index], function(response) {
				
				/* Wrap all the styles with a LESS expression using the page ID. */
				var page_styles = '#' + page_id + ' {\n';
				page_styles += response;
				page_styles += '\n}';
				
				/* Parse with the LESS parser using the new resource path. */
				var parser = new less.Parser({
					optimization: less.optimization,
					paths: [stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/css/']
				});
				parser.parse(page_styles, function(error, tree) {
					if (error) {
						console.log(error);
						console.log(page_styles);
					}
					/* The last replace is a fix for LESS parser paths parameter on Android. */
					if (tree && typeof tree.toCSS != 'undefined') {
						$('head').append('<style class="' + page_id + '">' + tree.toCSS().replace(/\bhtml/g, '.html').replace(/\bbody/g, '.body').replace(new RegExp(stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/css/' + stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/', 'g'), stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/') + '</style>');
					}
				});
				
				stylesheets -= 1;
				if (!stylesheets) {
					stageApp.stage.engines.inclusion.preloadPage.finalize(data, html, body, sheet_element, scripts, page_id);
				}
			});
		});
		
		/* Process the LESS stylesheets. */
		$.each(styles.less, function(index, value) {
			
			if (!(this.indexOf('//') > -1 && this.indexOf(window.location) < 0)) {
				var new_path = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/';
				if (this.indexOf(new_path) < 0) {
					styles.less[index] = new_path + this.replace(window.location, '');
				}
			}
			
			//$('head').append('<link rel="stylesheet/less" href="' + this + '" class="' + page_id + '" />');
			
			$.get(styles.less[index], function(data) {
				
				/* Wrap all the styles with a LESS expression using the page ID. */
				var page_styles = '#' + page_id + ' {';
				page_styles += response;
				page_styles += '}';
				
				/* Parse with the LESS parser using the new resource path. */
				var parser = new less.Parser({
					optimization: less.optimization,
					paths: [stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/css/']
				});
				parser.parse(page_styles, function(error, tree) {
					if (error) {
						console.log(error);
						console.log(page_styles);
					}
					if (tree && typeof tree.toCSS != 'undefined') {
						$('head').append('<style class="' + page_id + '">' + tree.toCSS() + '</style>');
					}
				});
				
				stylesheets -= 1;
				if (!stylesheets) {
					stageApp.stage.engines.inclusion.preloadPage.finalize(data, html, body, sheet_element, scripts, page_id);
				}
			});
		});
		
		//stageApp.cache.applicationCache.requestResources(styles.css);
		//stageApp.cache.applicationCache.requestResources(styles.less);
		
	};
	
	/* Finalize function for the page generation. Executed when all the external
	   stylesheets have been processed and appended. */
	stageApp.stage.engines.inclusion.preloadPage.finalize = function(data, html, body, sheet_element, scripts, page_id) {
		
		/* Refresh the appended LESS stylesheets. */
		//$.getScript('js/libs/less-1.3.1.min.js');
		//less.watch();
		less.refreshStyles();
		
		/* Remove the head and html tags from the content. */
		var modified = data.replace(/^[\S\s]*<\/head[^>]*?>/i, '').replace(/<\/html[\S\s]*$/i, '');
		content = $('<div/>');
		content.append(modified);
		
		/* Update any src attributes in the appended content with the new path. */
		content.find('[src]').not('[src^="http://"]').each(function() {
			$(this).attr('src', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('src'));
		});
		
		content.find('[poster]').not('[poster^="http://"]').each(function() {
			$(this).attr('poster', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('poster'));
		});
		
		content.find('[ios-portrait-poster]').not('[ios-portrait-poster^="http://"]').each(function() {
			$(this).attr('ios-portrait-poster', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('ios-portrait-poster'));
		});
		
		content.find('[ios-landscape-poster]').not('[ios-landscape-poster^="http://"]').each(function() {
			$(this).attr('ios-landscape-poster', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('ios-landscape-poster'));
		});
		
		var root_html_classes = ' ' + $('html').attr('class');
		
		/* Generate the new .html and .body elements with the old html and body element ids
		   and classes. These elements serve as wrappers for the page content. Append to the
		   sheet element. */
		sheet_element.html('<div id="' + html.id + '" class="html ' + html.classes + root_html_classes + '"><div id="' + body.id + '" class="body ' + body.classes + '">' + content.html() + '</div></div>');
		
		/* Apply scripts right away (not recommended). */
		//stageApp.stage.engines.inclusion.applyScripts(scripts);
		
		/* Store the scripts to be loaded later (when the page becomes active). */
		stageApp.stage.scripts[page_id] = scripts;
		
		var tags = sheet_element.find('*');
		var img_tags = tags.find('img');
		var posters = tags.find('[poster]');
		var images = [];
		
		$.each(img_tags, function() {
			//if ($(this).attr('src').indexOf('.svg') < 0) { // TODO: svg
				images.push($(this).attr('src'));
			//}
		});
		
		$.each(posters, function() {
			//if ($(this).attr('poster').indexOf('.svg') < 0) { // TODO: svg
				images.push($(this).attr('poster'));
			//}
			//if ($(this).attr('ios-portrait-poster').indexOf('.svg') < 0) {
				images.push($(this).attr('poster'));
			//}
			//if ($(this).attr('ios-landscape-poster').indexOf('.svg') < 0) {
				images.push($(this).attr('poster'));
			//}
		});
		
		for (var i = 0; i < tags.length; i++) {
			el = tags.get(i);
			if (el.currentStyle) {
				if (el.currentStyle['backgroundImage'] !== 'none') {
					var value = el.currentStyle['backgroundImage'].replace('url(', '').replace(')', '').split('"').join('').split("'").join('');
					var temp = value.split('/');
					if (temp[temp.length - 1] != 'undefined') {
						//if (value.indexOf('.svg') < 0) { // TODO: svg
							images.push(value);
						//}
					}
				}
			} else if (window.getComputedStyle) {
				if (document.defaultView.getComputedStyle(el, null).getPropertyValue('background-image') !== 'none') {
					var value = document.defaultView.getComputedStyle(el, null).getPropertyValue('background-image').replace('url(', '').replace(')', '').split('"').join('').split("'").join('');
					var temp = value.split('/');
					if (temp[temp.length - 1] != 'undefined') {
						//if (value.indexOf('.svg') < 0) { // TODO: svg
							images.push(value);
						//}
					}
				}
			}
		}
		
		var instances = []
		if (images.length) {
			images = $.unique(images);
		}
		$.each(images, function(index, value) {
			instances[index] = {}
			instances[index].source = this.toString();
		});
		
		//stageApp.cache.applicationCache.requestResources(images);
		
		if (typeof instances == 'undefined' || !instances.length) {
			setTimeout(function() {
				
				console.log("Page generation for the sheet " + sheet_element.attr('rel') + " ended with a timestamp: " + Math.round(+new Date()/1000));
				
				/* Set the sheet element height as high as its content. */
				sheet_element.height(sheet_element.children('.html').height());
				stageApp.stage.instance.update();
				setTimeout(function() {
					sheet_element.height(sheet_element.children('.html').height());
					stageApp.stage.instance.update();
				}, 500);
				
				if (fade_in) {
					var delay = 0;
					stageApp.stage.loadPage.fadeIn(sheet_element, delay);
				} else {
					sheet_element.css('opacity', 1);
				}
				//sheet_element.parent().children('.cloack, .spinner').remove();
				sheet_element.parent().children('.cloack').css('opacity', 0.99);
				sheet_element.addClass('cached');
				
			}, 500);
		} else {
			
			var returned = 0;
			$.each(instances, function(index, value) {
				var image = new Image();
				var instance = instances[index];
				$(image).load(function() {
					returned++;
					instance.ready = true;
					if (returned == instances.length) {
						
						console.log("Page generation for the sheet " + sheet_element.attr('rel') + " ended with a timestamp: " + Math.round(+new Date()/1000));
						
						setTimeout(function() {
							
							/* Set the sheet element height as high as its content. */
							sheet_element.height(sheet_element.children('.html').height());
							stageApp.stage.instance.update();
							setTimeout(function() {
								sheet_element.height(sheet_element.children('.html').height());
								stageApp.stage.instance.update();
							}, 500);
							
							if (fade_in) {
								var delay = 0;
								
								if (instances.length > 10) {
									delay = 1000;
								} else if (instances.length > 5) {
									delay = 500;
								}
								
								stageApp.stage.loadPage.fadeIn(sheet_element, delay);
							} else {
								sheet_element.css('opacity', 1);
							}
							//sheet_element.parent().children('.cloack, .spinner').remove();
							sheet_element.parent().children('.cloack').css('opacity', 0.99);
							sheet_element.addClass('cached');
							
						}, 0);
					}
				});
				image.src = instance.source;
			});
		
		}
		
	};
	
	/* The page URL relative to the web app, for example: content/magazine/2012-11/index.html. */
	var page_url = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + sheet_element.attr('rel');
	
	$.get(page_url, function(data) {
		stageApp.stage.engines.inclusion.preloadPage.prepare(data, sheet_element);		
	}).error(function(data) {
		stageApp.stage.engines.inclusion.preloadPage.prepare(data, sheet_element);
	});
	
};

/* Generates the HTML content from an external source to the given sheet element.
   The external source is specified by the sheet element's rel attribute. The second
   argument specifies whether the sheet element should be faded in after the page
   generation. */

stageApp.stage.engines.inclusion.generatePage = function(sheet_element, fade_in) {
	
	stageApp.stage.engines.inclusion.generatePage.prepare = function(data, sheet_element, fade_in) {
		
		if (typeof data != 'string') {
			data = '';
		}
		
		/* Note: The page ID takes just the first part of the file name when split with a dot.
		   An example of a page ID: magazine-2012-11-index. */
		var page_id = stageApp.stage.magazine_identifier + '-' + stageApp.stage.issue_identifier + '-' + sheet_element.attr('rel').split('.')[0];
		
		var scripts = [];
		
		var styles = {
			css: [],
			less: []
		};
		
		var html = {
			opening: '',
			classes: [],
			id: ''
		};
		var body = {
			opening: '',
			classes: [],
			id: ''
		};
		
		var dom = $(data);
		
		/* Get the scripts from the loaded content. */
		if (!dom.filter('script').length) {
			
			/* TODO: The following loads also commented out stylesheets and scripts. */
			
			/* For Android browser we can't use the fetched data as parsed jQuery object. */
			if (data.indexOf('<script') > -1) {
				var scripts_temp = data.match(/<script[^>]*(.*?)>/g);
				for (var i = 0; i < scripts_temp.length; i++) {
					var src = '';
					if (scripts_temp[i].indexOf(' src') > -1) {
						src = scripts_temp[i].match(/src=['\"](.*?)['\"]/i)[1];
						if (src.indexOf('//') < 0) {
							scripts.push(src);
						}
					}
				}
			}
		
		} else {
			
			dom.filter('script').each(function() {
				scripts.push(this.src);
			});
			
		}
		
		/* Get the regular and LESS stylesheets. */
		if (!dom.filter('link').length) {
			
			/* TODO: The following loads also commented out stylesheets and scripts. */
			
			/* For Android browser we can't use the fetched data as parsed jQuery object. */
			if (data.indexOf('<link') > -1) {
				var links = data.match(/<link[^>]*(.*?)>/g);
				for (var i = 0; i < links.length; i++) {
					var rel = '';
					var href = '';
					if (links[i].indexOf(' rel') > -1) {
						rel = links[i].match(/rel=['\"](.*?)['\"]/i)[1];
					}
					if (rel == 'stylesheet') {
						if (links[i].indexOf(' href') > -1) {
							href = links[i].match(/href=['\"](.*?)['\"]/i)[1];
						}
						if (href != '') {
							styles.css.push(href);
						}
					} else if (rel == 'stylesheet/less') {
						if (links[i].indexOf(' href') > -1) {
							href = links[i].match(/href=['\"](.*?)['\"]/i)[1];
						}
						if (href != '') {
							styles.less.push(href);
						}
					}
				}
			}
			
		} else {
			
			dom.filter('link').each(function() {
				if (this.rel == 'stylesheet') {
					styles.css.push(stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + this.href.replace(window.location, ''));
				} else if (this.rel == 'stylesheet/less') {
					styles.less.push(stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + this.href.replace(window.location, ''));
				}
			});
			
		}
		
		/* Get the opening tags for html and body respectively. */
		if (data.indexOf('<html') > -1) {
			html.opening = data.match(/<html[^>]*(.*?)>/i)[0];
		}
		if (data.indexOf('<body') > -1) {
			body.opening = data.match(/<body[^>]*(.*?)>/i)[0];
		}
		
		if (html.opening.indexOf(' class') > -1) {
			html.classes = html.opening.match(/class=['\"](.*?)['\"]/i)[1];
		}
		if (body.opening.indexOf(' class') > -1) {
			body.classes = body.opening.match(/class=['\"](.*?)['\"]/i)[1];
		}
		if (html.opening.indexOf(' id') > -1) {
			html.id = html.opening.match(/id=['\"](.*?)['\"]/i)[1];
		}
		if (body.opening.indexOf(' id') > -1) {
			body.id = body.opening.match(/id=['\"](.*?)['\"]/i)[1];
		}
		
		/* Total count of stylesheets. */
		var stylesheets = styles.css.length + styles.less.length;
		
		if (!stylesheets) {
			stageApp.stage.engines.inclusion.generatePage.finalize(data, html, body, sheet_element, fade_in, scripts, page_id);
		}
		
		/* Process the regular stylesheets. */
		$.each(styles.css, function(index, value) {
			
			if (!(this.indexOf('//') > -1 && this.indexOf(window.location) < 0)) {
				var new_path = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/';
				if (this.indexOf(new_path) < 0) {
					styles.css[index] = new_path + this.replace(window.location, '');
				}
			}
			
			//$('head').append('<link rel="stylesheet" href="' + this + '" class="' + page_id + '" />');
			
			$.get(styles.css[index], function(response) {
				
				/* Wrap all the styles with a LESS expression using the page ID. */
				var page_styles = '#' + page_id + ' {\n';
				page_styles += response;
				page_styles += '\n}';
				
				var paths_value = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/css/';
				if (styles.css[index].indexOf('/') > -1) {
					paths_value = styles.css[index].substring(0, styles.css[index].lastIndexOf('/') + 1);
				}
				
				/* Parse with the LESS parser using the new resource path. */
				var parser = new less.Parser({
					optimization: less.optimization,
					paths: [paths_value]
				});
				parser.parse(page_styles, function(error, tree) {
					if (error) {
						console.log(error);
						console.log(page_styles);
					}
					/* The last replace is a fix for LESS parser paths parameter on Android. */
					if (tree && typeof tree.toCSS != 'undefined') {
						$('head').append('<style class="' + page_id + '">' + tree.toCSS().replace(/\bhtml/g, '.html').replace(/\bbody/g, '.body').replace(new RegExp(paths_value + stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/', 'g'), stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/') + '</style>');
					}
				});
				
				stylesheets -= 1;
				if (!stylesheets) {
					stageApp.stage.engines.inclusion.generatePage.finalize(data, html, body, sheet_element, fade_in, scripts, page_id);
				}
			});
		});
		
		/* Process the LESS stylesheets. */
		$.each(styles.less, function(index, value) {
			
			if (!(this.indexOf('//') > -1 && this.indexOf(window.location) < 0)) {
				var new_path = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/';
				if (this.indexOf(new_path) < 0) {
					styles.less[index] = new_path + this.replace(window.location, '');
				}
			}
			
			//$('head').append('<link rel="stylesheet/less" href="' + this + '" class="' + page_id + '" />');
			
			$.get(styles.less[index], function(data) {
				
				/* Wrap all the styles with a LESS expression using the page ID. */
				var page_styles = '#' + page_id + ' {';
				page_styles += response;
				page_styles += '}';
				
				//console.log(styles.less[index] + ' ' + index);
				var paths_value = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/css/';
				if (styles.less[index].indexOf('/') > -1) {
					paths_value = styles.less[index].substring(0, styles.less[index].lastIndexOf('/') + 1);
					//console.log(paths_value);
				}
				
				/* Parse with the LESS parser using the new resource path. */
				var parser = new less.Parser({
					optimization: less.optimization,
					paths: [paths_value]
				});
				parser.parse(page_styles, function(error, tree) {
					if (error) {
						console.log(error);
						console.log(page_styles);
					}
					if (tree && typeof tree.toCSS != 'undefined') {
						$('head').append('<style class="' + page_id + '">' + tree.toCSS() + '</style>');
					}
				});
				
				stylesheets -= 1;
				if (!stylesheets) {
					stageApp.stage.engines.inclusion.generatePage.finalize(data, html, body, sheet_element, fade_in, scripts, page_id);
				}
			});
		});
		
		//stageApp.cache.applicationCache.requestResources(styles.css);
		//stageApp.cache.applicationCache.requestResources(styles.less);
		
	};
	
	/* Finalize function for the page generation. Executed when all the external
	   stylesheets have been processed and appended. */
	stageApp.stage.engines.inclusion.generatePage.finalize = function(data, html, body, sheet_element, fade_in, scripts, page_id) {
		
		/* Refresh the appended LESS stylesheets. */
		//$.getScript('js/libs/less-1.3.1.min.js');
		//less.watch();
		less.refreshStyles();
		
		/* Remove the head and html tags from the content. */
		var modified = data.replace(/^[\S\s]*<\/head[^>]*?>/i, '').replace(/<\/html[\S\s]*$/i, '');
		content = $('<div/>');
		content.append(modified);
		
		/* Update any src attributes in the appended content with the new path. */
		content.find('[src]').not('[src^="http://"]').each(function() {
			$(this).attr('src', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('src'));
		});
		
		content.find('[poster]').not('[poster^="http://"]').each(function() {
			$(this).attr('poster', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('poster'));
		});
		
		content.find('[ios-portrait-poster]').not('[ios-portrait-poster^="http://"]').each(function() {
			$(this).attr('ios-portrait-poster', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('ios-portrait-poster'));
		});
		
		content.find('[ios-landscape-poster]').not('[ios-landscape-poster^="http://"]').each(function() {
			$(this).attr('ios-landscape-poster', stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + $(this).attr('ios-landscape-poster'));
		});
		
		var root_html_classes = ' ' + $('html').attr('class');
		
		/* Generate the new .html and .body elements with the old html and body element ids
		   and classes. These elements serve as wrappers for the page content. Append to the
		   sheet element. */
		sheet_element.html('<div id="' + html.id + '" class="html ' + html.classes + root_html_classes + '"><div id="' + body.id + '" class="body ' + body.classes + '">' + content.html() + '</div></div>');
		
		/* Apply scripts right away (not recommended). */
		//stageApp.stage.engines.inclusion.applyScripts(scripts);
		
		/* Store the scripts to be loaded later (when the page becomes active). */
		stageApp.stage.scripts[page_id] = scripts;
		
		var tags = sheet_element.find('*');
		var img_tags = tags.find('img');
		var posters = tags.find('[poster]');
		var images = [];
		
		$.each(img_tags, function() {
			//if ($(this).attr('src').indexOf('.svg') < 0) { // TODO: svg
				images.push($(this).attr('src'));
			//}
		});
		
		$.each(posters, function() {
			//if ($(this).attr('poster').indexOf('.svg') < 0) { // TODO: svg
				images.push($(this).attr('poster'));
			//}
			//if ($(this).attr('ios-portrait-poster').indexOf('.svg') < 0) {
				images.push($(this).attr('poster'));
			//}
			//if ($(this).attr('ios-landscape-poster').indexOf('.svg') < 0) {
				images.push($(this).attr('poster'));
			//}
		});
		
		for (var i = 0; i < tags.length; i++) {
			el = tags.get(i);
			if (el.currentStyle) {
				if (el.currentStyle['backgroundImage'] !== 'none') {
					var value = el.currentStyle['backgroundImage'].replace('url(', '').replace(')', '').split('"').join('').split("'").join('');
					var temp = value.split('/');
					if (temp[temp.length - 1] != 'undefined') {
						//if (value.indexOf('.svg') < 0) { // TODO: svg
							images.push(value);
						//}
					}
				}
			} else if (window.getComputedStyle) {
				if (document.defaultView.getComputedStyle(el, null).getPropertyValue('background-image') !== 'none') {
					var value = document.defaultView.getComputedStyle(el, null).getPropertyValue('background-image').replace('url(', '').replace(')', '').split('"').join('').split("'").join('');
					var temp = value.split('/');
					if (temp[temp.length - 1] != 'undefined') {
						//if (value.indexOf('.svg') < 0) { // TODO: svg
							images.push(value);
						//}
					}
				}
			}
		}
		
		var instances = []
		if (images.length) {
			images = $.unique(images);
		}
		$.each(images, function(index, value) {
			instances[index] = {}
			instances[index].source = this.toString();
		});
		
		//stageApp.cache.applicationCache.requestResources(images);
		
		if (typeof instances == 'undefined' || !instances.length) {
			setTimeout(function() {
				
				console.log("Page generation for the sheet " + sheet_element.attr('rel') + " ended with a timestamp: " + Math.round(+new Date()/1000));
				
				/* Set the sheet element height as high as its content. */
				sheet_element.height(sheet_element.children('.html').height());
				stageApp.stage.instance.update();
				setTimeout(function() {
					sheet_element.height(sheet_element.children('.html').height());
					stageApp.stage.instance.update();
				}, 500);
				
				if (fade_in) {
					var delay = 0;
					stageApp.stage.loadPage.fadeIn(sheet_element, delay);
				} else {
					sheet_element.css('opacity', 1);
				}
				//sheet_element.parent().children('.cloack, .spinner').remove();
				sheet_element.parent().children('.cloack').css('opacity', 0.99);
				sheet_element.addClass('cached');
				
			}, 500);
		} else {
			
			var returned = 0;
			$.each(instances, function(index, value) {
				var image = new Image();
				var instance = instances[index];
				$(image).load(function() {
					returned++;
					instance.ready = true;
					if (returned == instances.length) {
						
						console.log("Page generation for the sheet " + sheet_element.attr('rel') + " ended with a timestamp: " + Math.round(+new Date()/1000));
						
						setTimeout(function() {
							
							/* Set the sheet element height as high as its content. */
							sheet_element.height(sheet_element.children('.html').height());
							stageApp.stage.instance.update();
							setTimeout(function() {
								sheet_element.height(sheet_element.children('.html').height());
								stageApp.stage.instance.update();
							}, 500);
							
							if (fade_in) {
								var delay = 0;
								
								if (instances.length > 10) {
									delay = 1000;
								} else if (instances.length > 5) {
									delay = 500;
								}
								
								stageApp.stage.loadPage.fadeIn(sheet_element, delay);
							} else {
								sheet_element.css('opacity', 1);
							}
							//sheet_element.parent().children('.cloack, .spinner').remove();
							sheet_element.parent().children('.cloack').css('opacity', 0.99);
							sheet_element.addClass('cached');
							
						}, 0);
					}
				});
				image.src = instance.source;
			});
		
		}
		
	};
	
	/* Note: The page ID takes just the first part of the file name when split with a dot.
	   An example of a page ID: magazine-2012-11-index. */
	var page_id = stageApp.stage.magazine_identifier + '-' + stageApp.stage.issue_identifier + '-' + sheet_element.attr('rel').split('.')[0];
	
	/* Give the page ID to the sheet element. */
	sheet_element.attr('id', page_id);
	
	/* The page URL relative to the web app, for example: content/magazine/2012-11/index.html. */
	var page_url = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/' + sheet_element.attr('rel');
	
	$.get(page_url, function(data) {
		stageApp.stage.engines.inclusion.generatePage.prepare(data, sheet_element, fade_in);		
	}).error(function(data) {
		stageApp.stage.engines.inclusion.generatePage.prepare(data, sheet_element, fade_in);
	});
	
};

/* Applies JavaScripts from the external HTML page when using the inclusion engine.
   Can be used to apply any other scripts as well. Takes the scripts as an array. */

stageApp.stage.engines.inclusion.applyScripts = function(scripts) {
	
	stageApp.stage.engines.inclusion.applyScripts.count = 0;
	stageApp.stage.engines.inclusion.applyScripts.progress = 0;
	
	/* Append as a script tag to the document body. */
	stageApp.stage.engines.inclusion.applyScripts.appendScript = function(source) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = source;
		script.className = 'active-sheet-script';
		document.body.appendChild(script);
		console.log("Appended a script: " + script);
	};
	
	/* Remove appended scripts from the document body. */
	stageApp.stage.engines.inclusion.applyScripts.removeScripts = function() {
		$('.active-sheet-script').remove();
		console.log("Removed all the active sheet scripts.");
	};
	
	/* Load and evaluate the script with the jQuery getScript function. */
	stageApp.stage.engines.inclusion.applyScripts.evaluateScript = function(source, index) {
		var script_poller = setInterval(function() {
			if (stageApp.stage.engines.inclusion.applyScripts.progress == index) {
				$.getScript(source).done(function() {
					console.log("Loaded a script successfully: " + source);
					stageApp.stage.engines.inclusion.applyScripts.progress++;
				}).fail(function() {
					console.log("Failed to load a script: " + source);
					stageApp.stage.engines.inclusion.applyScripts.progress++;
				});
				clearInterval(script_poller);
			}
		}, 50);
	};
	
	if (typeof scripts == 'undefined') {
		return;
	}
	
	$.each(scripts, function(index, script) {
		
		if (script.toString().indexOf('//') > -1 && script.toString().indexOf(window.location) < 0) {
			return;
		}
		
		/* Remove the application URL from the script source. */
		var original = this.toString().replace(window.location, '');
		
		/* Get just the script file name. */
		var file = original.split('/');
		file = file[file.length - 1];
		
		/* Generate the new extended path for the script. */
		var prepend = stageApp.resources.content_path + stageApp.stage.magazine_identifier + '/' + stageApp.stage.issue_identifier + '/';
		
		/* Include the new path if not already present. */
		if (!original.indexOf(prepend) > -1) {
			scripts[index] = prepend + original;
		}
		
		/* Exclude jQuery and Modernizr scripts (except jQuery plugins). */
		if ((file.indexOf('jquery') < 0 || file.indexOf('.jquery') > -1) && file.indexOf('modernizr') < 0) {
			/* Check that no script with the same file name is present in the DOM. */
			if (!$('script[src*="' + file + '"]').length) {
				//stageApp.stage.engines.inclusion.applyScripts.appendScript(scripts[index]);
				//stageApp.cache.applicationCache.requestResources([scripts[index]]);
				stageApp.stage.engines.inclusion.applyScripts.evaluateScript(scripts[index], stageApp.stage.engines.inclusion.applyScripts.count);
				stageApp.stage.engines.inclusion.applyScripts.count++;
			}
		}
	});
	
	//stageApp.stage.engines.inclusion.applyScripts.removeScripts();
	
};

stageApp.stage.engines.live.generatePage = function(sheet_element, fade_in) {
	
	
	
};


/* stageApp.binders
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* General function for setting window orientation change event bindings. */
stageApp.binders.windowOrientationChange = function() {
	
	$(window).bind('orientationchange', function() {
		stageApp.tools.redraw('#stand, #stage, #curtain');
	});
	
};

/* General function for setting window resize event bindings. */
stageApp.binders.windowResize = function() {
	
	$(window).bind('resize', function() {
		stageApp.stand.render.updateShadow();
	});
	
	$(window).bind('resize orientationchange', function() {
		setTimeout(function() {
			/* For the sandbox engine. */
			$('#stage .frame').each(function() {
				var frame = $(this);
				var min_height = frame.contents().height();
				frame.height(min_height);
				frame.parent().height(min_height);
			});
			/* For the inclusion engine. */
			$('#stage .html').each(function() {
				var html = $(this);
				var height = html.height();
				html.parent().height(html.height());
			});
			stageApp.stage.instance.update();
		}, 500);
	});
	
};

/* General function for setting the user interface bindings. */
stageApp.binders.userInterface = function() {
	
	/* Magzine issue cover links on the stand. */
	$('#stand .issue').live('click', function() {
		
		/* Load the issue with the issue ID. */
		stageApp.stage.loadIssue($(this).attr('id'));
		
		/* Store the stand scroll position. */
		stageApp.stand.scroll = parseInt($(window).scrollTop());
		
		/* Hide the stand with the curtain. */
		$('#curtain').show();
		setTimeout(function() {
			$('#curtain').css('opacity', 1);
			
			/* Hide the stand after the curtain is fully visible. */
			setTimeout(function() {
				$('#stand').hide();
				
				/* Unload all the images used in the issue covers. */
				//$('.cover-style').each(function() {
				//	$(this).html($(this).html().replace(/url\([^)]+\)/g, 'none'));
				//});
				$('#stand .cover, #stand .issue').each(function() {
					$(this).css('backgroundImage', 'none');
				});
				$('.cover-style').remove();
				
				/* Clear the stand content. */
				$('#stand .content').html('');
				
				/* Load the first page content. */
				stageApp.stage.loadPage(stageApp.stage.page);
				
				/* Set the stage and show it. */
				setTimeout(function() {
					$('#stage').show();
					stageApp.stage.instance.setup(stageApp.stage.page - 1);
					setTimeout(function() {
						
						/* Hide the curtain to make the stage visible. */
						$('#curtain').css('opacity', 0);
						setTimeout(function() {
							$('#curtain').hide();
						}, 500);
						
					}, 0);
				}, 500);
				
			}, 500);
			
		}, 50);
		return false;
	});
	
	/* The return link over the stage view. */
	$('#return').live('click', function() {
		$('#curtain').show();
		setTimeout(function() {
			$('#curtain').css('opacity', 1);
			setTimeout(function() {
				$('#stage').hide();
				stageApp.stage.unloadIssue();
				stageApp.stand.render();
				stageApp.stand.premiere();
				//$(window).scrollTop(stageApp.stand.scroll);
			}, 500);
		}, 50);
		return false;
	});
	
	/* Escape key. */
	$(document).live('keyup', function(e) {
		if (e.keyCode == 27) {
			$('#curtain').show();
			setTimeout(function() {
				$('#curtain').css('opacity', 1);
				setTimeout(function() {
					$('#stage').hide();
					stageApp.stage.unloadIssue();
					stageApp.stand.render();
					stageApp.stand.premiere();
					//$(window).scrollTop(stageApp.stand.scroll);
				}, 500);
			}, 50);
			return false;
		}
	});
	
	/* Settings link of the navigation bar on the stand.
	   Used at the moment to control the issue info presentation form. */
	$('#stand .navigation .ui.settings').live('click', function() {
		if ($('#stand .content').hasClass('info-overlayed')) {
			$('#stand .content').addClass('info-hidden');
			$('#stand .content').removeClass('info-overlayed')
		} else if ($('#stand .content').hasClass('info-hidden')) {
			$('#stand .content').removeClass('info-hidden');
		} else {
			$('#stand .content').addClass('info-overlayed');	
		}
		return false;
	});
	
	/* Links appearing in the stage content. */
	$('#stage a').live('click', function(e) {
		if (stageApp.stage.instance.dragging) {
			return false;
		}
		if (this.href.indexOf('http://') == 0) {
			if (this.href.indexOf(location.hostname) > -1) {
				// Local link.
				var pid = this.href.split('/');
				pid = pid[pid.length - 1];
				stageApp.stage.instance.slide($('.sheet[rel="' + pid + '"]').parent().index());
				return false;
			} else {
				// External link.
				window.open(this.href);
				return false;
			}
		} else if (this.href == '#') {
			return false;
		} else if (this.href.indexOf('#') != 0) {
			// Local link.
			var pid = this.href.split('/');
			pid = pid[pid.length - 1];
			stageApp.stage.instance.slide($('.sheet[rel="' + pid + '"]').parent().index());
			return false;
		}
	});
	
};


/* stageApp.cahce
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

stageApp.cache.webStorage.detect = function() {
	
	if (Modernizr.localstorage) {
		stageApp.cache.webStorage.available = true;
	}
	
};

stageApp.cache.webStorage.getStandDate = function() {
	
	if (typeof localStorage == 'undefined') {
		return null;
	}
	
	try {
		//return JSON.parse(localStorage.getItem('stand')).json.updated;
		return "0000-00-00";
	} catch(e) {
		return null;
	}
	
};

stageApp.cache.webStorage.storeStand = function(stand_json) {
	
	if (typeof localStorage == 'undefined') {
		return false;
	}
	
	try {
		var stand_cache = { 'json': stand_json };
		
		
		var stand_covers = [];
		
		$.each(stand_json.content, function() {
			var parent_identifier = this.identifier;
			$.each(this.issues, function() {
				var cover_path = stageApp.resources.content_path + parent_identifier + '/' + this.identifier + '/';
				$.each(this.covers, function() {
					
					var image = new Image();
					
					$(image).load(function() {
						
						try {
							/*var canvas = document.createElement("canvas");
							canvas.width = image.width;
							canvas.height = image.height;
							
							var ctx = canvas.getContext("2d");
							ctx.drawImage(image, 0, 0);
							
							var dataURL = canvas.toDataURL("image/png");
							
							localStorage.removeItem(cover_path + this.toString());
							var storage_before = parseInt(unescape(encodeURIComponent(JSON.stringify(localStorage))).length);
							console.log("Storage size before: " + storage_before);
							
							localStorage.setItem(cover_path + this.toString(), dataURL.toString());
							
							var dataurl_length = dataURL.length;
							console.log("DataURL size: " + dataurl_length);
							
							var key_length = parseInt((cover_path + this.toString()).length) + 8;
							console.log("Key size: " + key_length);
							
							var storage_after = parseInt(unescape(encodeURIComponent(JSON.stringify(localStorage))).length);
							console.log("Storage size after: " + storage_after);
							
							var key_real = storage_after - storage_before - dataurl_length - key_length;
							console.log("Key size should be: " + key_real);*/
						} catch (e) {
							//if (e == QUOTA_EXCEEDED_ERR) {
								localStorage.clear();
								console.log("HTML5 Local Storage was cleared because the quota was exceeded.");
							//}
						}
						//console.log(dataURL);
					});
					
					image.src = cover_path + this.toString();
					
					//console.log('data:image/png;base64,' + stageApp.tools.base64encode());
				});
			});
		});
		
		/*$.each(stageApp.resources.app_images, function() {
			var image = $('<img src="' + this.source + '" />');
			var instance = this;
			$(image).load(function() {
				instance.ready = true;
				var done = true;
				$.each(stageApp.resources.app_images, function() {
					if (!this.ready) {
						done = false;
						return;
					}
				});
				if (done) {
					$('#stand').show();
					if (!$(window).scrollTop()) {
						setTimeout(function() {
							window.scrollTo(0, 1);
						}, 0);
					}
					setTimeout(function() {
						$('#curtain').css('opacity', 0);
						setTimeout(function() {
							$('#curtain').hide();
						}, 500);
					}, 2000);
				}
			});
		});*/
		
		localStorage.setItem('stand', JSON.stringify(stand_cache));
		return true;
	} catch(e) {
		return false;
	}
	
};

stageApp.cache.webStorage.loadStand = function() {
	
	if (typeof localStorage == 'undefined') {
		return false;
	}
	
	try {
		console.log(JSON.parse(localStorage.getItem('stand')));
		return true;
	} catch(e) {
		return false;
	}
	
};

stageApp.cache.webStorage.storeIssue = {};

stageApp.cache.webStorage.storeIssue.activePage = function(issue_identifier, active_page) {
	
	if (typeof localStorage == 'undefined') {
		return false;
	}
	
	try {
		localStorage.setItem(issue_identifier + '-active-page', active_page);
		return true;
	} catch(e) {
		return false;
	}
	
};

stageApp.cache.webStorage.loadIssue = {};

stageApp.cache.webStorage.loadIssue.activePage = function(issue_identifier) {
	
	if (typeof localStorage == 'undefined') {
		return 0;
	}
	
	try {
		return localStorage.getItem(issue_identifier + '-active-page');
	} catch(e) {
		return 0;
	}
	
};

stageApp.cache.applicationCache.detect = function() {
	
	if (Modernizr.applicationcache) {
		stageApp.cache.applicationCache.available = true;
	}
	
};

stageApp.cache.applicationCache.storeStand = function() {
	
	
	
};

/* Helper feature for debugging HTML5 application cache - by Jonathan Stark. */
stageApp.cache.applicationCache.toggleDebug = function(state) {
	
	if (!state) {
		return;
	}
	
	var cacheStatusValues = [];
	cacheStatusValues[0] = 'uncached';
	cacheStatusValues[1] = 'idle';
	cacheStatusValues[2] = 'checking';
	cacheStatusValues[3] = 'downloading';
	cacheStatusValues[4] = 'updateready';
	cacheStatusValues[5] = 'obsolete';
	
	var cache = window.applicationCache;
	cache.addEventListener('cached', logEvent, false);
	cache.addEventListener('checking', logEvent, false);
	cache.addEventListener('downloading', logEvent, false);
	cache.addEventListener('error', logEvent, false);
	cache.addEventListener('noupdate', logEvent, false);
	cache.addEventListener('obsolete', logEvent, false);
	cache.addEventListener('progress', logEvent, false);
	cache.addEventListener('updateready', logEvent, false);
	
	function logEvent(e) {
		var online, status, type, message;
		online = (navigator.onLine) ? 'yes' : 'no';
		status = cacheStatusValues[cache.status];
		type = e.type;
		message = 'online: ' + online;
		message += ', event: ' + type;
		message += ', status: ' + status;
		if (type == 'error' && navigator.onLine) {
			message += ' (prolly a syntax error in manifest)';
		}
		console.log(message);
	}
	
	window.applicationCache.addEventListener('updateready', function() {
		//window.applicationCache.swapCache();
		console.log('swap cache has been called');
	}, false);
	
	/*setInterval(function() {
		try {
			cache.update();
		} catch(e) {
			//console.log(e);
		};
	}, 10000);*/
	
};

//stageApp.cache.applicationCache.requestResources(["content/test.png"]);

stageApp.cache.applicationCache.requestResources = function(resources) {
	
	if (!stageApp.cache.applicationCache.available) {
		return false;
	}
	
	if (typeof resources == 'undefined' || !resources.length) {
		return;
	}
	
	if (!stageApp.cache.cookies.getUUID()) {
		stageApp.cache.cookies.storeUUID(stageApp.cache.cookies.generateUUID());
		if (!stageApp.cache.cookies.getUUID()) {
			return false;
		}
	}
	console.log("UUID for the client: " + stageApp.cache.cookies.getUUID());
	
	$.post("cache/alter.php", { resources: resources }, function(data) {
		
		window.applicationCache.onupdateready = function(e) {
			window.applicationCache.swapCache();
			// Resources ready to be used in the DOM. TODO: Updated cached status.
		}
		
		window.applicationCache.update();
		
	});
	
	return true;
	
};

stageApp.cache.applicationCache.removeResources = function(resources) {
	
	if (!stageApp.cache.applicationCache.available) {
		return false;
	}
	
	if (typeof resources == 'undefined' || !resources.length) {
		return;
	}
	
	if (!stageApp.cache.cookies.getUUID()) {
		stageApp.cache.cookies.storeUUID(stageApp.cache.cookies.generateUUID());
		if (!stageApp.cache.cookies.getUUID()) {
			return false;
		}
	}
	console.log("UUID for the client: " + stageApp.cache.cookies.getUUID());
	
	$.post("cache/alter.php", { garbage: resources }, function(data) {
		
		window.applicationCache.onupdateready = function(e) {
			window.applicationCache.swapCache();
			// Resources ready to be used in the DOM. TODO: Updated cached status.
		}
		
		window.applicationCache.update();
		
	});
	
	return true;
	
};

stageApp.cache.applicationCache.clearCachedResources = function() {
	
	if (!stageApp.cache.applicationCache.available) {
		return false;
	}
	
	if (!stageApp.cache.cookies.getUUID()) {
		stageApp.cache.cookies.storeUUID(stageApp.cache.cookies.generateUUID());
		if (!stageApp.cache.cookies.getUUID()) {
			return false;
		}
	}
	
	$.get("cache/alter.php", function(data) {});
	$.post("cache/alter.php", {}, function(data) {
		
		window.applicationCache.onupdateready = function(e) {
			window.applicationCache.swapCache();
		}
		
		window.applicationCache.update();
		
	});
	
	return true;
	
};

stageApp.cache.cookies.detect = function() {
	
	if (Modernizr.cookies) {
		stageApp.cache.cookies.available = true;
	}
	
};

stageApp.cache.cookies.generateUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

stageApp.cache.cookies.storeUUID = function(UUID) {
	var date = new Date();
	date.setDate(date.getDate() + 36500);
	document.cookie = "UUID" + "=" + escape(UUID) + "; expires=" + date.toUTCString() + "; path=/;";
};

stageApp.cache.cookies.getUUID = function() {
	var i, x, y, cookies = document.cookie.split(";");
	for (i = 0; i < cookies.length; i++) {
		x = cookies[i].substr(0, cookies[i].indexOf("="));
		y = cookies[i].substr(cookies[i].indexOf("=") + 1);
		x = x.replace(/^\s+|\s+$/g, "");
		if (x == "UUID") {
			return unescape(y);
		}
	}
	return null;
};


/* stageApp.tools
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* Helper function for toggling the logging state. */
stageApp.tools.toggleLogging = function(state) {
	
	if (!state) {
		var logger = console.log;
		console.log = function() {
			if (state) {
				logger.apply(this, arguments);
			}
		};
	}
	
};

/* Helper function for redrawing the selector element or elements. */
stageApp.tools.redraw = function(selector) {
	
	$(selector).height($(selector).height() - 1);
	setTimeout(function() { $(selector).height(''); $(selector).height(null); }, 1);
	
};

/* Helper function for encoding to base64. */
stageApp.tools.base64encode = function(data) {
	// http://kevin.vanzonneveld.net
	// +   original by: Tyler Akins (http://rumkin.com)
	// +   improved by: Bayron Guevara
	// +   improved by: Thunder.m
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Pellentesque Malesuada
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: Rafał Kukawski (http://kukawski.pl)
	var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
		ac = 0,
		enc = "",
		tmp_arr = [];
	
	if (!data) {
		return data;
	}
	
	do {
		o1 = data.charCodeAt(i++);
		o2 = data.charCodeAt(i++);
		o3 = data.charCodeAt(i++);
		
		bits = o1 << 16 | o2 << 8 | o3;
		
		h1 = bits >> 18 & 0x3f;
		h2 = bits >> 12 & 0x3f;
		h3 = bits >> 6 & 0x3f;
		h4 = bits & 0x3f;
		
		tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
	} while (i < data.length);
	
	enc = tmp_arr.join('');
	
	var r = data.length % 3;
	
	return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
	
}


$(document).ready(function() {
	stageApp.init();
});
