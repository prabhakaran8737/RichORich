$(function() {
	var count = 0;
	$.fn.richorich = function(option) {
		if(typeof(option)== 'object' || typeof(option)=='undefined') {
			var args = (typeof(option)=='object'?[option]:[]);

			return this.each(function() {
				return methods.init.apply(this, args);
			});

		} else if(typeof(option)=='string' && typeof(methods[option])=='function') {
			// Extract and find the keycode
			var args = Array.prototype.slice.call(arguments, 1);

			return this.each(function() {
				// method[option] returns function
				return methods[option].apply(this, args);
			});
		} else {
			console.log('Method ' + option + ' not found');
		}
	};

	var methods = {
		init: function(options) {
			var self = this,
				editable_css = {'width': 'inherit', 'height': 'inherit'},
				current_content, updated_content, data;

			this.options = $.extend({
				limit: 140,
				css: {'height': '150px', 'width': '200px'},
				availableId: 'counter',
				exceeded: function() {},
			}, options);

			// Rangy not working without initialization
			// This can be improved I think so
			rangy.init();

			this.index = count++;
			this.$limit = this.options.limit;
			this.$availableId = this.options.availableId;
			this.$exceeded = this.options.exceeded;
			//this.$ctrl = false;

			// Regular Expression for &nbsp; to space will not work for chrome
			// To fix that use `white-space: pre` in css
			this.$editable = $('<div contenteditable="true">')
							.css(editable_css)
							.css({'white-space':'pre'});

			data = {
				html: $(this).html(),
				ntrim: true
			};

			// Get the present content during initialization
			$(self).richorich('processHTML', data);

			// Append the content editable to the html wrapper
			$(this).html(this.$editable).css(this.options.css);

			// Bind events for content editable
			this.$editable.bind('keydown', function(e) {
				this.$ctrl = (e.which==17)?true:false;
				this.$selectAll = (this.$ctrl && e.which==65)?true:false;
			}).bind('keyup', function(e) {
				// Convert to Browser Readable format
				data = {
					html: $(this).html(),
					ltrim: true
				};
				if(!this.$selectAll) {
					$(self).richorich('reveal', {data: data, elem: $(self), keycode: e.which});
				}
			}).bind('mouseup', function(e) {
				// $(self).richorich('reveal');
			}).select(function() {
				console.log('select all');
			});

			// Bind Mouse Up event
			this.$editable
			setTimeout(function() {
				self.$editable.focus();
			}, 50);
		},
		reveal: function(data) {
			// 36 - Home
			// 37 - Left Arrow
			// 39 - Right Arrow
			if(data.keycode==13 || data.keycode==36 || data.keycode==37 || data.keycode==39) {
				return false;
			}
			data.elem.richorich('processHTML', data.data);
		},
		processHTML: function(args) {
			var str = args.html, available, range, text, element,
								available_elem = $('#'+this.$availableId);
			text = 	str.replace(/<br>/g,'\n')
			element = this.$editable.get()[0];
			// Use respective trims if needed
			if(args.ltrim) { text = methods.ltrim(text); }
			if(args.ntrim) { text = methods.ntrim(text); }

			text = text
				.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,function($0,$1){return ''})
				.replace(/<br><div>/gi,'\n')
				.replace(/<div><br><\/div>/gi,'\n')
				.replace(/<br>&nbsp;/gi,'\n\n')
				.replace(/<div>|<br>|<\/p>/gi,'\n');

			// Hack for IE
			if($.browser.msie) {
				text = text
								.replace(/\n/g,' ')
								.replace(/&nbsp;/g,' ')
								.replace('  ',' ')
								.replace('  ',' ');
			}

			available = this.$limit - text.length;

			// Convert hashtag and url to link
			text = text.linkify({
				formatHref: function (value, type) {
					if (type === 'hashtag') {
						$($(element)[0]).tagautocomplete({
						// $('div#example').tagautocomplete({					
						source: ['#ann', '#bill', '#casey', '#work', '#finance', '#home'],
						character: '#',
						after: function () {
							// alert(0);	
						}
					});
				}
				return value;
				}
			});

			// Can improve this
			if(available<0) {
				available_elem.removeClass('info').addClass('warn');
				this.$exceeded.call(this, available);
			} else {
				available_elem.removeClass('warn').addClass('info');
			}

			// Update the counter
			available_elem.text(available);
			// Update the content in contentexitable
			this.$editable.html(text);
			// Update the cursor position
			methods.carot(element);
		},
		ltrim: function(str) {
			// Left trim
			return str.replace(/^[ \\s\u00A0 ]+/g,'');
		},
		ntrim: function(str) {
			// Normal trim
			return $.trim(str);
		},
		carot: function(element) {
			// Following cursor fix is added by refering
			// http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
			if(document.createRange()) {
				// Firefox, Chrome, Opera, Safari, IE 9+
				range = document.createRange();
				range.selectNodeContents(element);
				range.collapse(false);
				selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
			} else {
				//IE 8 and lower
				range = document.body.createTextRange();
		        range.moveToElementText(element);
		        range.collapse(false);
		        range.select();
			}

		}
	};
});
