describe('dateTime - api - valFormat() Luxon', function () {
	dt.libs({
		js: ['jquery', 'datatables', 'luxon', 'datetime'],
		css: ['datatables', 'datetime']
	});

	let el;

	function pad(num) {
		return num < 10 ? '0' + num : num;
	}

	// TK COLIN make this a generic function somewhere as repeated
	function format(d) {
		return d.getUTCFullYear() + '-' + pad(1 + d.getUTCMonth()) + '-' + pad(d.getUTCDate());
	}

	let today = format(new Date());

	describe('Check the defaults', function () {
		dt.html('input');
		it('Ensure its a function', function () {
			DateTime.use(window.luxon);
			el = new DateTime(document.getElementById('test'));
			expect(typeof el.valFormat).toBe('function');
		});
		it('Getter returns null if no date set', function () {
			expect(el.valFormat('yyyy-MM-dd')).toBe(null);
		});
		it('Setter returns an API instance', function () {
			expect(el.valFormat('yyyy-MM-dd', today) instanceof DateTime).toBe(true);
		});
		it('Getter returns a string when date set', function () {
			expect(el.valFormat('yyyy-MM-dd')).toBe(today);
		});
	});

	describe('Functional tests', function () {
		dt.html('input');
		it('Write a formatted value', function () {
			el = new DateTime(document.getElementById('value'));
			el.valFormat('MM-dd-yyyy', '01-18-2023');
			expect(format(el.val())).toBe('2023-01-18');
		});

		it('Write a complicated formatted value', function () {
			el.valFormat('EEEE d MMMM yyyy', 'Friday 14 October 2011');
			expect(format(el.val())).toBe('2011-10-14');
		});

		it('Read to a format', function () {
			let res = el.valFormat('M-d-yy');
			expect(res).toBe('10-14-11');
		});

		it('Read to a complicated format', function () {
			let res = el.valFormat('EEE d MMM yy');
			expect(res).toBe('Fri 14 Oct 11');
		});
	});

	describe('With a format', function () {
		dt.html('input');

		it('Write a standard value', function () {
			el = new DateTime(document.getElementById('value'), {
				format: 'EEEE d MMMM yyyy'
			});
			el.val('Friday 14 October 2011');
			expect(document.getElementById('value').value).toBe('Friday 14 October 2011');
		});

		it('Write a formatted value', function () {
			el.valFormat('yy-MM-dd', '23-01-19');
			expect(document.getElementById('value').value).toBe('Thursday 19 January 2023');
		});

		it('Read to a format', function () {
			let res = el.valFormat('M-d-yy');
			expect(res).toBe('1-19-23');
		});
	});
});
