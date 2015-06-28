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
			this.$editable.bind('keyup', function(e) {
				$(self).richorich('reveal', e.which);
				// Convert to Browser Readable format
				data = {
					html: $(this).html(),
					ltrim: true
				};

				$(self).richorich('processHTML', data);

			});

			// Bind Mouse Up event
			this.$editable.bind('mouseup', function(e) {
				$(self).richorich('reveal');
			});
			setTimeout(function() {
				self.$editable.focus();
			}, 50);
		},
		reveal: function(keycode) {
			var self = this,
				editor = this.$editable.get()[0],
				selection;
			selection = rangy.getSelection().saveCharacterRanges(editor);
		},
		processHTML: function(args) {
			var str = args.html, available, range, text,
								available_elem = $('#'+this.$availableId);
			text = 	str.replace(/<br>/g,'\n')

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

			// Convert hashtag to link
			text = text.replace(/\B#\w+/g, function(hash_tag) {
				return '<span>'+hash_tag+'</span>';
			});

			available = this.$limit - text.length;

			// Can improve this
			if(available<0) {
				available_elem.removeClass('info').addClass('warn');
				this.$exceeded.call(this, available);
			} else {
				available_elem.removeClass('warn').addClass('info');
			}

			available_elem.text(available);
			this.$editable.html(text);
			
			range = rangy.getSelection().saveCharacterRanges(this.$editable);
			console.log(range);
		},
		ltrim: function(str) {
			// Left trim
			return str.replace(/^[ \\s\u00A0 ]+/g,'');
		},
		ntrim: function(str) {
			// Normal trim
			return $.trim(str);
		}
	};
});
