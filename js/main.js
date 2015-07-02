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
				element,
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

			// Regular Expression for &nbsp; to space will not work for chrome
			// To fix that use `white-space: pre` in css
			this.$editable = $('<div contenteditable="true">')
							.css(editable_css)
							.css({'white-space':'pre'});

			data = {
				html: $(this).html(),
				ntrim: true
			};

			this.previousText = $.trim($(this).html().replace(/<br>/g,'\n'));

			// Get the present content during initialization
			$(self).richorich('processHTML', data);

			// Append the content editable to the html wrapper
			$(this).html(this.$editable).css(this.options.css);

			// Bind events for content editable
			this.$editable.bind('keydown', function(e) {
				// To detect ctrl + A
				if(!this.$ctrl) {
					this.$ctrl = (e.which==17)?true:false;
				}
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
			});

			// Bind Mouse Up event
			setTimeout(function() {
				self.$editable.focus();
				element = self.$editable.get()[0];
				methods.caret(element);
			}, 50);
		},
		reveal: function(data) {
			// console.log('Keycode: ' + data.keycode);
			// 36 - Home
			// 37 - Left Arrow
			// 38 - Up Arrow
			// 39 - Right Arrow
			// 40 - Down Arrow
			if(data.keycode==36 || 
					data.keycode==37 || data.keycode==38 || 
					data.keycode==39 || data.keycode==40) {
				return false;
			}
			data.elem.richorich('processHTML', {html: data.data.html, keycode: data.keycode});
		},
		processHTML: function(args) {
			var str = args.html, available, range, text, 
							element, selection, start_range=0, end_range=0, 
							available_elem = $('#'+this.$availableId);

			text = 	str.replace(/<br>/g,'\n')
			text = methods.stripTags(text);

			element = this.$editable.get()[0];

			// Use respective trims if needed
			if(args.ltrim) { text = methods.ltrim(text); }
			if(args.ntrim) { text = methods.ntrim(text); }
			
			// Trace the Cursor Position
			selection = rangy.getSelection().saveCharacterRanges(element);
			
			// Check the position
			if(selection.length) {
				var start_range = selection[0].characterRange.start;
				var end_range = selection[0].characterRange.end;
			}
			
			if(start_range==0 && args.keycode==13) {
				// Execute when empty text detected
				text = this.previousText + '\n\n';
			} else if(args.keycode==13 && start_range==this.previousText.length+1) {
				// Execute line ending
				console.log('link ending');
				text = methods.ltrim(this.previousText) + '\n\n';
			} else {
				console.log('exception');
				text = methods.extractText(text);
			}
			
			available = this.$limit - text.length;

			// Update the new text
			this.previousText = text;

			// Convert hashtag and url to link
			text = text.linkify();
			console.log('---', text);
			// Can improve this
			if(available<0) {
				available_elem.removeClass('info').addClass('warn');
				this.$exceeded.call(this, available);
			} else {
				available_elem.removeClass('warn').addClass('info');
			}

			// Update the counter
			available_elem.text(available);

			// Update the content in contenteditable
			this.$editable.html(text.replace(/\n/g, "<br />"));

			// Restore the Cursor Position
			rangy.getSelection().restoreCharacterRanges(element, selection);

		},
		ltrim: function(str) {
			// Left trim
			return str.replace(/^[ \\s\u00A0 ]+/g,'');
		},
		ntrim: function(str) {
			// Normal trim
			return $.trim(str);
		},
		stripTags: function(text) {
			text = text
				.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,function($0,$1){return ''});
			return text;
		},
		extractText: function(text) {
			text = text
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
			return text;
		},
		caret: function(element) {
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
