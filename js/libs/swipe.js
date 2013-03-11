/*
 * Swipe 1.0
 *
 * Brad Birdsall, Prime
 * Copyright 2011, Licensed GPL & MIT
 *
 *
 * StageSwipe.js 1.0
 *
 * Rami Alatalo, Aalto University
 * Copyright 2012, Licensed GPL & MIT
 *
*/

window.Stage = function(element, options) {
	
	// Return immediately if the element doesn't exist.
	if (!element) return null;
	
	var _this = this;
	
	// Retrieve the options.
	this.options = options || {};
	this.index = this.options.start_sheet || 0;
	this.speed = this.options.swipe_speed || 300;
	this.callback = this.options.callback || function() {};
	this.delay = this.options.slide_show || 0;
	
	// Reference the DOM elements.
	this.container = element;					// Stage Framework: #stage
	this.element = this.container.children[0];	// Stage Framework: #stage .viewport
	
	// Static CSS.
	this.container.style.overflow = 'hidden';
	this.element.style.listStyle = 'none';
	this.element.style.margin = 0;
	
	// Trigger slider initialization.
	this.setup(0);
	
	// Begin auto slideshow.
	this.begin();
	
	// Add event listeners.
	if (this.element.addEventListener) {
		this.element.addEventListener('mousewheel', this, false);
		this.element.addEventListener('mousedown', this, false);
		this.element.addEventListener('mousemove', this, false);
		this.element.addEventListener('mouseup', this, false);
		this.element.addEventListener('mouseout', this, false);
		this.element.addEventListener('touchstart', this, false);
		this.element.addEventListener('touchmove', this, false);
		this.element.addEventListener('touchend', this, false);
		this.element.addEventListener('touchcancel', this, false);
		this.element.addEventListener('touchleave', this, false);
		this.element.addEventListener('webkitTransitionEnd', this, false);
		this.element.addEventListener('msTransitionEnd', this, false);
		this.element.addEventListener('oTransitionEnd', this, false);
		this.element.addEventListener('transitionend', this, false);
		window.addEventListener('resize', this, false);
	}
	
};

Stage.prototype = {
	
	setup: function(start_index) {
		
		this.blacklisted = false;
		this.hideScrollDelay = 750;
		
		this.decelerating = false;
		this.deceleration = null;
		
		this.decelerationtime = 0;
		
		this.dragging = false;
		
		// Get and measure amount of slides.
		this.slides = this.element.children;
		this.length = this.slides.length;
		
		// Return immediately if there are no slides.
		if (this.length < 1) return null;
		
		// Determine width and height of each slide.
		this.width = ("getBoundingClientRect" in this.container) ? this.container.getBoundingClientRect().width : this.container.offsetWidth;
		// Determine height of each slide.
		this.height = ("getBoundingClientRect" in this.container.children) ? this.container.getBoundingClientRect().height : this.container.offsetHeight;
		
		// Return immediately if measurement fails.
		if (!this.width) return null;
		if (!this.height) return null;
		
		// Hide slider element but keep positioning during the setup.
		this.container.style.visibility = 'hidden';
		
		// Dynamic CSS.
		this.element.style.width = (this.slides.length * this.width) + 'px';
		var index = this.slides.length;
		this.slideheight = [];
		while (index--) {
			var el = this.slides[index];
			el.style.width = this.width + 'px';
			el.style.display = 'table-cell';
			el.style.verticalAlign = 'top';
			
			// Determine height of each slide.
			this.slideheight[index] = ("getBoundingClientRect" in this.container.children[0]) ? this.container.children[0].children[index].children[0].getBoundingClientRect().height : this.container.children[0].children[index].children[0].offsetHeight;
			
			// Return immediately if measurement fails.
			if (!this.slideheight[index]) return null;
		}
		
		this.indicatorUpdateTimer = null;
		this.indicatorTimer = null;
		
		this.fadingIn = false;
		this.fadingOut = false;
				
		// Create the scroll indicator.
		var wrapper = document.createElement('div');
		wrapper.id = 'wrapper';
		var indicator = document.createElement('div');
		indicator.id = 'indicator';
		
		// Dynamic CSS for the scroll indicator.
		wrapper.style.position = 'fixed';
		wrapper.style.width = '0.5%';
		wrapper.style.minWidth = '5px';
		wrapper.style.height = '97%';
		wrapper.style.right = '1.25%';
		wrapper.style.top = '1.5%';
		wrapper.style.display = 'none';
		
		indicator.style.background = 'rgba(0, 0, 0, 0.75)';
		indicator.style.width = '100%';
		indicator.style.height = '100%';
		indicator.style.borderRadius = '10px';
		indicator.style.position = 'absolute';
		
		wrapper.appendChild(indicator);
		this.container.appendChild(wrapper);
		
		// Dynamic style element for the keyframe scrolling.
		var keyframestyle = document.createElement('style');
		keyframestyle.id = 'scrollcss';
		document.head.appendChild(keyframestyle);
		
		// Set start position and force translate to remove the initial flickering.
		if (start_index > -1 && start_index < this.length) {
			this.index = start_index;
		} else {
			this.index = 0;
		}
		this.slide(this.index, 0); 
		
		// Show the slider element.
		this.container.style.visibility = 'visible';
		
		this.mousedown = false;
		
		this.warmupSlide();
		this.warmupScroll();
		
	},
	
	update: function() {
		
		// Determine width and height of each slide.
		this.width = ("getBoundingClientRect" in this.container) ? this.container.getBoundingClientRect().width : this.container.offsetWidth;
		// Determine height of each slide.
		this.height = ("getBoundingClientRect" in this.container.children) ? this.container.getBoundingClientRect().height : this.container.offsetHeight;
		
		var index = this.slides.length;
		this.slideheight = [];
		while (index--) {
			var el = this.slides[index];
			el.style.width = this.width + 'px';
			el.style.display = 'table-cell';
			el.style.verticalAlign = 'top';
			
			// Determine height of each slide.
			this.slideheight[index] = ("getBoundingClientRect" in this.container.children[0]) ? this.container.children[0].children[index].children[0].getBoundingClientRect().height : this.container.children[0].children[index].children[0].offsetHeight;
			
			// Return immediately if measurement fails.
			if (!this.slideheight[index]) return null;
		}
		
	},
	
	reconstruct: function() {
		
		this.blacklisted = false;
		
		this.decelerating = false;
		this.deceleration = null;
		
		// Return immediately if there are no slides.
		if (this.length < 1) return null;
		
		// Determine width and height of each slide.
		this.width = ("getBoundingClientRect" in this.container) ? this.container.getBoundingClientRect().width : this.container.offsetWidth;
		// Determine height of each slide.
		this.height = ("getBoundingClientRect" in this.container.children) ? this.container.getBoundingClientRect().height : this.container.offsetHeight;
		
		// Return immediately if measurement fails.
		if (!this.width) return null;
		if (!this.height) return null;
		
		// Hide slider element but keep positioning during setup.
		this.container.style.visibility = 'hidden';
		
		// Dynamic CSS.
		this.element.style.width = (this.slides.length * this.width) + 'px';
		var index = this.slides.length;
		this.slideheight = [];
		while (index--) {
			var el = this.slides[index];
			el.style.width = this.width + 'px';
			el.style.display = 'table-cell';
			el.style.verticalAlign = 'top';
			
			// Determine height of each slide.
			this.slideheight[index] = ("getBoundingClientRect" in this.container.children[0]) ? this.container.children[0].children[index].children[0].getBoundingClientRect().height : this.container.children[0].children[index].children[0].offsetHeight;
			
			// Return immediately if measurement fails.
			if (!this.slideheight[index]) return null;
		}
		
		this.indicatorUpdateTimer = null;
		this.indicatorTimer = null;
		
		this.fadingIn = false;
		this.fadingOut = false;
		
		// Set start position and force translate to remove the initial flickering.
		this.slide(this.index, 0); 
		
		// Show slider element.
		this.container.style.visibility = 'visible';
		
		this.mousedown = false;
		
		this.warmupScroll();
		
	},
	
	warmupSlide: function() {
		
		// Warm up the horizontal translate3d.
		var style = this.element.style;
		
		style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = 0 + 'ms';
		
		style.MozTransform = style.webkitTransform = 'translate3d(' + -((this.index * this.width) + 1) + 'px,0,0)';
		style.msTransform = style.OTransform = 'translateX(' + -((this.index * this.width) + 1) + 'px)';
		
		style.MozTransform = style.webkitTransform = 'translate3d(' + -(this.index * this.width) + 'px,0,0)';
		style.msTransform = style.OTransform = 'translateX(' + -(this.index * this.width) + 'px)';
		
		style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = this.speed + 'ms';
		
	},
	
	warmupScroll: function() {
		
		// Warm up the vertical translate3d.
		var style = this.element.children[this.index].children[0].style;
		var previous = parseInt(this.getTransform(this.element.children[this.index].children[0])[5]);
		
		style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = 0 + 'ms';
		
		if (!previous || previous > 0) {
			previous = 0;
		} else if (previous < -(this.slideheight[this.index] - this.height)) {
			previous = -(this.slideheight[this.index] - this.height);
		}
		
		style.MozTransform = style.webkitTransform = 'translate3d(0,' + -(this.slideheight[this.index] - this.height) + 'px,0)';
		style.msTransform = style.OTransform = 'translateY(' + -(this.slideheight[this.index] - this.height) + 'px)';
		
		style.MozTransform = style.webkitTransform = 'translate3d(0,' + previous + 'px,0)';
		style.msTransform = style.OTransform = 'translateY(' + previous + 'px)';
		
		style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = this.speed + 'ms';
		
	},
	
	slide: function(index, duration) {
		
		var style = this.element.style;
		
		// Fallback to the default speed.
		if (duration == undefined) {
			duration = this.speed;
		}
		
		if (index < 0) {
			index = 0;
		} else if (index > this.slides.length - 1) {
			index = this.slides.length - 1;
		}
		
		// Set duration speed (0 represents 1-to-1 scrolling).
		style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = duration + 'ms';
		
		// Translate to the given index position.
		style.MozTransform = style.webkitTransform = 'translate3d(' + -(index * this.width) + 'px,0,0)';
		style.msTransform = style.OTransform = 'translateX(' + -(index * this.width) + 'px)';
		
		// Set new index to allow for expression arguments.
		this.index = index;
		
		this.warmupScroll();
		
	},
	
	scroll: function(offset, duration, indicator) {
		
		var style = this.element.children[this.index].children[0].style;
		
		// Fallback to the default speed.
		if (duration == undefined) {
			duration = this.speed;
		}
		
		if (indicator) {
			this.updateScrollIndicatorForPeriod(duration, 1000 / 60);
		}
		
		// Set duration speed (0 represents 1-to-1 scrolling).
		style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = duration + 'ms';
		
		// Translate to the given index position.
		style.MozTransform = style.webkitTransform = 'translate3d(0,' + Math.round(offset * 100) / 100 + 'px,0)';
		style.msTransform = style.OTransform = 'translateY(' + Math.round(offset * 100) / 100 + 'px)';
		
	},
	
	decelerate: function(offset, amount) {
		
		var temp = /*parseInt(this.getTransform(this.element.children[this.index].children[0])[5])*/offset;
		if (amount < 0.1 && amount > -0.1 || (amount < 1 && amount > -1 && (temp > 0 || temp < -(this.slideheight[this.index] - this.height)))) {
			clearTimeout(this.deceleration);
			if (temp > 0) {
				this.scroll(0, this.speed, true);
			} else if (temp < -(this.slideheight[this.index] - this.height)) {
				this.scroll(-(this.slideheight[this.index] - this.height), this.speed, true);
			}
			this.hideScrollIndicator(this.hideScrollDelay);
			return;
		} else {
			
			amount = 
				(amount / 
					( (offset + amount > 0
						|| offset + amount < -(this.slideheight[this.index] - this.height)
					) ? 
					( (Math.abs(amount) / this.height) * 100 + 1 ) // Determine the resistance level.
					: 1 ));										   // No resistance if false.
			this.scroll(offset - amount, 0, false);
			var a = this;
			this.deceleration = setTimeout(function() {
				a.decelerate(offset - amount, amount * 0.95);
			}, 1000 / 60);
		}
		this.updateScrollIndicator();
		
	},
	
	decelerateCSS: function(offset, amount) {
		
		if (this.keyframescroll) {
			clearTimeout(this.keyframescroll);
		}
		
		this.decelerationtime = 0;
		var css = this.generateCSS(offset, amount);
		
		this.element.children[this.index].children[0].style.webkitAnimationPlayState = 'paused';
		this.element.children[this.index].children[0].style.webkitAnimationFillMode = 'forwards';
		
		var d = new Date;
		var hash = d.getTime();
		
		var t = '@-webkit-keyframes scroll' + hash + ' {';
		var percent = 0;
		var increment = Math.round((100 / css.length) * 100) / 100;
		
		var last = css[css.length - 1];
		var a = this;
		
		$.each(css, function(index, value) {
			t = t + percent + '% { -webkit-transform: translate3d(0px, ' + parseFloat(this) + 'px, 0px);}';
			if (index == css.length - 2) {
				percent = 100;
			} else {
				percent = parseFloat(parseFloat(percent) + parseFloat(increment)).toFixed(2);
			}
			a.decelerationtime = a.decelerationtime + (1000 / 60);
		});
		console.log(t);
		t = t + '}';
		$('#scrollcss').text(t);
		
		this.updateScrollIndicatorForPeriod(this.decelerationtime, 1000 / 60);
		
		this.element.children[this.index].children[0].style.webkitAnimationDuration = this.decelerationtime + 'ms';
		this.element.children[this.index].children[0].style.webkitAnimationName = 'scroll' + hash;
		this.element.children[this.index].children[0].style.webkitAnimationPlayState = 'running';
		
		this.keyframescroll = setTimeout(function() {
			
			a.element.children[a.index].children[0].style.webkitTransform = '';
			a.element.children[a.index].children[0].style.webkitTransform = 'translate3d(0px, ' + last + 'px, 0px)';
			
			a.element.children[a.index].children[0].style.webkitAnimationPlayState = 'paused';
			a.element.children[a.index].children[0].style.webkitAnimationName = '';
			//a.element.children[a.index].children[0].style.webkitAnimationDuration = '0ms';
			
			if (last > 0 || last < -(a.slideheight[a.index] - a.height)) {
				if (last > 0) {
					a.scroll(0, a.speed, true);
				} else if (last < -(a.slideheight[a.index] - a.height)) {
					a.scroll(-(a.slideheight[a.index] - a.height), a.speed, true);
				}
				a.hideScrollIndicator(a.hideScrollDelay);
				return;
			} else {
				a.hideScrollIndicator();
			}
			
			$('#scrollcss').text('');
		}, this.decelerationtime);
		
	},
	
	generateCSS: function(offset, amount) {
		
		if (amount < 0.1 && amount > -0.1 || (amount < 1 && amount > -1 && (offset > 0 || offset < -(this.slideheight[this.index] - this.height)))) {
			if (offset > 0) {
				//this.scroll(0, this.speed, true);
				//return [0];
				
				/*var steps = parseInt(this.speed / (1000 / 60));
				var increment = Math.round(offset / steps * 100) / 100;
				var temp = [];
				for (i = 0; i < steps; i++) {
					if (i == steps - 1) {
						temp.push(0);
					} else {
						temp.push(offset - (increment * i + 1));
					}
				}
				return temp;*/
				
			} else if (offset < -(this.slideheight[this.index] - this.height)) {
				
				//this.scroll(-(this.slideheight[this.index] - this.height), this.speed, true);
				//return [-(this.slideheight[this.index] - this.height)];
				
				/*var steps = parseInt(this.speed / (1000 / 60));
				var increment = Math.round((this.slideheight[this.index] - this.height + offset) / steps * 100) / 100;
				var temp = [];
				for (i = 0; i < steps; i++) {
					if (i == steps - 1) {
						temp.push(-(this.slideheight[this.index] - this.height));
					} else {
						temp.push(offset + (increment * i + 1));
					}
				}
				return temp;*/
				
			}
			//this.hideScrollIndicator(this.hideScrollDelay);
			return [];
		} else {
			
			amount = 
				(amount / 
					( (offset + amount > 0
						|| offset + amount < -(this.slideheight[this.index] - this.height)
					) ? 
					( (Math.abs(amount) / this.height) * 100 + 1 ) // Determine the resistance level.
					: 1 ));										   // No resistance if false.
			
			//this.scroll(offset - amount, 0, true);
			var temp = [offset - amount];
			$.each(this.generateCSS(offset - amount, amount * 0.95), function() {
				temp.push(Math.round(this * 100) / 100);
			});
			return temp;
		}
		
	},
	
	getPos: function() {
			
		// Return current index position.
		return this.index;
		
	},
	
	prev: function(delay) {
		
		// Cancel next scheduled automatic transition, if any.
		this.delay = delay || 0;
		clearTimeout(this.interval);
		
		// If not at first slide.
		if (this.index) this.slide(this.index-1, this.speed);
		
	},
	
	next: function(delay) {
		
		// Cancel next scheduled automatic transition, if any.
		this.delay = delay || 0;
		clearTimeout(this.interval);
		
		if (this.index < this.length - 1) this.slide(this.index+1, this.speed); // If not last slide.
		else this.slide(0, this.speed); // If last slide return to start.
		
	},
	
	begin: function() {
		
		var _this = this;
		
		this.interval = (this.delay)
			? setTimeout(function() { 
				_this.next(_this.delay);
			}, this.delay)
			: 0;
		
	},
	
	stop: function() {
		this.delay = 0;
		clearTimeout(this.interval);
	},
	
	resume: function() {
		this.delay = this.options.auto || 0;
		this.begin();
	},
	
	handleEvent: function(e) {
		switch (e.type) {
			case 'mousewheel': this.onTouchStart(e); this.onTouchMove(e); this.onTouchEnd(e); break;
			case 'mousedown':
			case 'touchstart': this.onTouchStart(e); break;
			case 'mousemove':
			case 'touchmove': this.onTouchMove(e); break;
			case 'mouseup':
			case 'mouseout':
			case 'touchcancel':
			case 'touchleave':
			case 'touchend': this.onTouchEnd(e); break;
			case 'webkitTransitionEnd':
			case 'msTransitionEnd':
			case 'oTransitionEnd':
			case 'transitionend': this.transitionEnd(e); break;
			case 'resize': this.reconstruct(); break;
		}
	},
	
	transitionEnd: function(e) {
			
		if (this.delay) this.begin();
		
		this.callback(e, this.index, this.slides[this.index]);
		this.blacklisted = false;
		
	},
	
	onTouchStart: function(e) {
		
		if (this.decelerating) {
			this.decelerating = false;
			clearTimeout(this.deceleration);
		}
		
		if (this.keyframescroll) {
			clearTimeout(this.keyframescroll);
		}
		
		var style = {
			parent: this.element.style,
			children: this.element.children[this.index].children[0].style
		};
		
		var temp = parseInt(this.getTransform(this.element.children[this.index].children[0])[5]);
		
		style.children.webkitTransform = '';
		style.children.webkitTransform = 'translate3d(0px, ' + temp + 'px, 0px)';
		
		style.children.webkitAnimationPlayState = 'paused';
		style.children.webkitAnimationName = '';
		
		if (temp > 0) {
			this.scroll(0, this.speed, true);
		} else if (temp < -(this.slideheight[this.index] - this.height)) {
			this.scroll(-(this.slideheight[this.index] - this.height), this.speed, true);
		}
		
		if (e.type == 'mousedown') {
			e.preventDefault();
			this.mousedown = true;
		}
		
		this.start = {
			
			// Get touch coordinates for delta calculations in onTouchMove.
			pageX: parseInt(e.type == 'touchstart' ? e.touches[0].pageX : e.pageX),
			pageY: parseInt(e.type == 'touchstart' ? e.touches[0].pageY : e.pageY),
			
			// Set the previous index content scroll position (offset).
			offsetY: parseInt(this.getTransform(this.element.children[this.index].children[0])[5]),
			
			// Set initial timestamp of touch sequence.
			time: Number(new Date())
			
		};
		
		this.previous = {
			
			pageX: this.start.pageX,
			pageY: this.start.pageY
			
		};
		
		// Used for testing first onTouchMove event.
		this.isScrolling = undefined;
		
		// Reset deltaX and deltaY.
		this.deltaX = 0;
		this.deltaY = 0;
		
		this.crossOver = 0;
		this.crossBelow = 0;
		
		// Set transition time to 0 for 1-to-1 touch movement.
		style.parent.webkitTransitionDuration = style.parent.MozTransitionDuration = style.parent.msTransitionDuration = style.parent.OTransitionDuration = style.parent.transitionDuration = 0 + 'ms';
		
		style.children.webkitTransitionDuration = style.children.MozTransitionDuration = style.children.msTransitionDuration = style.children.OTransitionDuration = style.children.transitionDuration = 0 + 'ms';
		
		e.stopPropagation();
	},
	
	onTouchMove: function(e) {
		
		if ("activeElement" in document) {
			document.activeElement.blur();
		}
		
		// Ensure swiping with one touch and not pinching.
		if(e.type == 'touchmove' && (e.touches.length > 3 || e.scale && e.scale !== 1)) return;
		if(e.type == 'mousemove' && !this.mousedown) return;
		
		this.dragging = true;
		
		this.mid = {
			
			pageX: parseInt(e.type == 'touchmove' ? e.touches[0].pageX : e.pageX),
			pageY: parseInt(e.type == 'touchmove' ? e.touches[0].pageY : e.pageY),
			
			// Set mid timestamp of touch sequence.
			time: Number(new Date())
			
		};
		
		this.previous.deltaX = this.previous.pageX - this.mid.pageX;
		this.previous.deltaY = this.previous.pageY - this.mid.pageY;
		
		this.previous.pageX = this.mid.pageX;
		this.previous.pageY = this.mid.pageY;
		
		this.deltaX = this.mid.pageX - this.start.pageX;
		this.deltaY = this.mid.pageY - this.start.pageY;
				
		// Determine if scrolling test has run - one time test.
		if ( typeof this.isScrolling == 'undefined') {
			this.isScrolling = !!( this.isScrolling || Math.abs(this.deltaX) < Math.abs(this.deltaY) );
		}
		
		this.offsetY = parseFloat(this.getTransform(this.element.children[this.index].children[0])[5]);
		this.positionY = this.deltaY;
		
		// If user is not trying to scroll vertically.
		if (!this.isScrolling) {
			
			// Prevent native scrolling.
			e.preventDefault();
			/*if (!this.eventTriggered) {
				window.dispatchEvent(this.horizontalSwipeStarted);
			}
			this.eventTriggered = true;*/
			
			// Cancel slideshow.
			clearTimeout(this.interval);
			
			this.hideScrollIndicator(0);
			
			// Increase resistance if first or last slide.
			this.deltaX = 
				this.deltaX / 
					( (!this.index && this.deltaX > 0		// If first slide and sliding left
						|| this.index == this.length - 1	// or if last slide and sliding right
						&& this.deltaX < 0					// and if sliding at all.
					) ? 
					( Math.abs(this.deltaX) / this.width + 1 )	// Determine the resistance level.
					: 1 );										// No resistance if false.
			
			// Translate immediately 1-to-1.
			this.element.style.webkitTransform = this.element.style.MozTransform = this.element.style.transform =	'translate3d(' + (this.deltaX - this.index * this.width) + 'px,0,0)';
			
			this.element.style.msTransform = this.element.style.OTransform = 'translateX(' + (this.deltaX - this.index * this.width) + 'px)';
			
		} else {
			
			// Prevent native scrolling.
			e.preventDefault();
			
			var animating = false;
			var classes = this.element.children[this.index].children[0].className.split(' ');
			for (var i = 0; i < classes.length; i++) {
				if (classes[i] == 'animating') {
					animating = true;
				}
			}
			if (animating) {
				this.blacklisted = true;
				return;
			}
			
			// Cancel slideshow.
			clearTimeout(this.interval);
			
			this.showScrollIndicator();
			
			if (this.deltaY + this.start.offsetY < -(this.slideheight[this.index] - this.height)) {
				this.crossBelow = -(this.slideheight[this.index] - this.height) - this.start.offsetY;
				this.crossOver = this.deltaY - this.crossBelow;
				this.positionY = this.crossOver;
			} else if (this.deltaY + this.start.offsetY > 0) {
				this.crossBelow = -this.start.offsetY;
				this.crossOver = this.deltaY - this.crossBelow;
				this.positionY = this.crossOver;
			} else {
				this.crossBelow = 0;
				this.crossOver = 0;
				this.positionY = this.deltaY;
			}
			
			// Increase resistance if above or below.
			this.positionY = 
				this.positionY / 
					( (this.deltaY + this.start.offsetY > 0	// 
						|| this.deltaY + this.start.offsetY < -(this.slideheight[this.index] - this.height) // 
					) ? 
					( Math.abs(this.positionY) / this.height + 1 )	// Determine the resistance level.
					: 1 );											// No resistance if false.
				
			if (this.deltaY + this.start.offsetY > 0 || this.deltaY + this.start.offsetY < -(this.slideheight[this.index] - this.height)) {
				this.positionY = Math.round((this.positionY + this.crossBelow + this.start.offsetY)*10)/10;
			} else {
				this.positionY = Math.round((this.positionY + this.start.offsetY)*10)/10;
			}
			
			// Translate immediately 1-to-1.
			this.element.children[this.index].children[0].style.webkitTransform = this.element.children[this.index].children[0].style.MozTransform =	this.element.children[this.index].children[0].style.transform = 'translate3d(0,' + this.positionY + 'px,0)';
			
			this.element.children[this.index].children[0].style.msTransform = this.element.children[this.index].children[0].style.OTransform = 'translateY(' + this.positionY + 'px)';
			
			this.updateScrollIndicator();
		}
		
		e.stopPropagation();
	},
	
	onTouchEnd: function(e) {
		
		if (e.type == 'mouseout' && this.mousedown == false) return;
		if (typeof(this.start) == 'undefined') return;
		this.mousedown = false;
		this.blacklisted = false;
		
		var a = this;
		setTimeout(function() {
			a.dragging = false;
		}, 100);
		
		/*this.end = {
			
			pageX: parseInt(e.type == 'touchend' ? e.touches[0].pageX : e.pageX),
			pageY: parseInt(e.type == 'touchend' ? e.touches[0].pageY : e.pageY),
			
			// Set final timestamp of touch sequence.
			time: Number(new Date())
			
		};*/
		
		// If not scrolling vertically.
		if (!this.isScrolling) {
			
			// Determine if slide attempt triggers next/prev slide.
			var isValidSlide = 
				Number(new Date()) - this.start.time < 250	// If slide duration is less than 250ms
				&& Math.abs(this.deltaX) > 20				// and if slide amt is greater than 20px
				|| Math.abs(this.deltaX) > this.width/2,	// or if slide amt is greater than half the width.
			
			// Determine if slide attempt is past start and end.
			isPastBounds = 
				!this.index && this.deltaX > 0							// If first slide and slide amt is greater than 0
				|| this.index == this.length - 1 && this.deltaX < 0;	// or if last slide and slide amt is less than 0.
			
			// Call slide function with slide end value based on isValidSlide and isPastBounds tests.
			this.slide( this.index + ( isValidSlide && !isPastBounds ? (this.deltaX < 0 ? 1 : -1) : 0 ), this.speed );
			
			this.hideScrollIndicator(this.hideScrollDelay);
			
		} else {
			
			if (this.positionY > 0) {
				this.scroll(0, this.speed, true);
				this.hideScrollIndicator(this.hideScrollDelay);
			} else if (this.positionY < -(this.slideheight[this.index] - this.height)) {
				this.scroll(-(this.slideheight[this.index] - this.height), this.speed, true);
				this.hideScrollIndicator(this.hideScrollDelay);
			} else {
				
				if (e.type != 'mouseout') {
					this.decelerating = true;
					var amount = 0;
					if (this.previous.deltaY > 0) {
						amount = Math.abs(this.previous.deltaY);
					} else {
						amount = -Math.abs(this.previous.deltaY);
					}
					this.decelerate(this.positionY, amount);
					//this.decelerateCSS(this.positionY, amount);
				} else {
					this.hideScrollIndicator(this.hideScrollDelay);
				}
				
			}
			
		}
		
		e.stopPropagation();
	},
	
	/* Needs jQuery. */
	getTransform: function(e) {
		var attribute, values;
		
		if ($(e).css('-webkit-transform') != null && $(e).css('-webkit-transform') != '') {
			attribute = '-webkit-transform';
		} else if ($(e).css('-moz-transform') != null && $(e).css('-moz-transform') != '') {
			attribute = '-moz-transform';
		} else if ($(e).css('-o-transform') != null && $(e).css('-o-transform') != '') {
			attribute = '-o-transform';
		} else if ($(e).css('-ms-transform') != null && $(e).css('-ms-transform') != '') {
			attribute = '-ms-transform';
		} else {
			attribute = 'transform';
		}
		
		if (e && $(e) && $(e).css(attribute)) {
			values = $(e).css(attribute).replace('matrix(', '').replace(')', '').split(',');
			$.each(values, function(index, value) {
				values[index] = parseInt(value);
			});
		}
		if (typeof values == 'undefined' || isNaN(values[0])) {
			values = [0, 0, 0, 0, 0, 0];
		}
		
		return values;
	},
	
	/* Needs jQuery. */
	showScrollIndicator: function() {
		
		//if (this.fadingIn) return; // TODO
		
		if (this.indicatorTimer) {
			clearTimeout(this.indicatorTimer);
		}
		
		if (this.fadingOut || !this.fadingIn) {
			this.fadingOut = false;
			this.fadingIn = true;
		}
		
		if ($('#wrapper').css('display') == 'none') {
			document.getElementById('wrapper').style.opacity = '0';
			document.getElementById('wrapper').style.display = 'block';
		}
		
		var a = this;
		$('#wrapper').stop().animate({
			opacity: 1
		}, 250, function() {
			a.fadingIn = false;
			a.fadingOut = false;
		});
		
	},
	
	/* Needs jQuery. */
	hideScrollIndicator: function(delay) {
		
		this.indicatorTimer = setTimeout(function() {
			this.fadingIn = false;
			this.fadingOut = true;
			var a = this;
			$('#wrapper').stop().animate({
				opacity: 0
			}, 250, function() {
				document.getElementById('wrapper').style.display = 'none';
				a.fadingOut = false;
				a.fadingIn = false;
			});
		}, delay);
		
	},
	
	updateScrollIndicator: function() {
		
		var top = '0';
		var bottom = '0';
		var margin = '0';
		var height = (this.height / this.slideheight[this.index]) < 1 ? parseInt((this.height / this.slideheight[this.index]) * 100) + '%' : '100%';
		
		var position = parseInt(this.getTransform(this.element.children[this.index].children[0])[5]);
		
		if (position > 0) {
			margin = '0';
			top = Math.round(position / this.height * 100 * 100) / 100 * 1.03 + '%';
		} else if (position < -(this.slideheight[this.index] - this.height)) {
			margin = 100 - parseInt(height) + '%';
			margin = parseInt((1 - this.height / this.slideheight[this.index]) * (this.height * 0.97)) + 'px';
			
			bottom = Math.round((Math.abs(position) - (this.slideheight[this.index] - this.height)) / this.height * 100 * 100) / 100 * 1.03 + '%';
			top = '-' + bottom;
		} else {
			margin = Math.round((100 - parseInt(height)) * Math.abs(position) / (this.slideheight[this.index] - this.height) * 100)/100 + '%';
			margin = parseInt((1 - this.height / this.slideheight[this.index]) * Math.abs(position) / (this.slideheight[this.index] - this.height) * (this.height * 0.97)) + 'px';
			
		}
		
		document.getElementById('indicator').style.height = height;
		document.getElementById('indicator').style.marginTop = margin;
		document.getElementById('indicator').style.top = top;
		document.getElementById('indicator').style.bottom = bottom;
		
	},
	
	updateScrollIndicatorForPeriod: function(time, fps) {
		
		if (typeof(time) == 'undefined' || typeof(fps) == 'undefined') return;
		
		fps = 1 / fps * 100;
		
		if (time > fps) {
			this.updateScrollIndicator();
			var a = this;
			this.indicatorUpdateTimer = setTimeout(function() {
				a.updateScrollIndicatorForPeriod(time - fps, fps);
			}, fps);
		} else {
			if (this.indicatorUpdateTimer) {
				clearTimeout(this.indicatorUpdateTimer);
			}
		}
		
	}
	
};
