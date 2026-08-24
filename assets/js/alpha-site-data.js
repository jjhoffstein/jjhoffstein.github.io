(function (root) {
	'use strict';

	var MAX_IMPORT_BYTES = 1024 * 1024;
	var MAX_SITES = 500;
	var STATUSES = ['Sourced', 'Site Visit', 'LOI', 'Negotiation', 'Signed'];

	function fail(message) {
		throw new TypeError(message);
	}

	function textField(value, name, maxLength, required, nullable) {
		if (nullable && (value === null || value === undefined || value === '')) return null;
		if (value === undefined && !required) return '';
		if (typeof value !== 'string') fail(name + ' must be text.');
		var normalized = value.trim();
		if (required && normalized.length === 0) fail(name + ' is required.');
		if (normalized.length > maxLength) fail(name + ' must be ' + maxLength + ' characters or fewer.');
		return normalized;
	}

	function integerField(value, name, minimum) {
		if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
			fail(name + ' must be a whole number of at least ' + minimum + '.');
		}
		return value;
	}

	function booleanField(value, name) {
		if (typeof value !== 'boolean') fail(name + ' must be true or false.');
		return value;
	}

	function normalizeSite(value) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Each site must be an object.');

		var zipCode = textField(value.zip_code, 'Zip code', 10, false, true);
		if (zipCode !== null && !/^\d{5}(?:-\d{4})?$/.test(zipCode)) {
			fail('Zip code must use 12345 or 12345-6789 format.');
		}

		var status = value.status === undefined ? 'Sourced' : value.status;
		if (typeof status !== 'string' || STATUSES.indexOf(status) === -1) {
			fail('Status must be one of: ' + STATUSES.join(', ') + '.');
		}

		var dateAdded = value.date_added === undefined || value.date_added === null || value.date_added === ''
			? null
			: textField(value.date_added, 'Date added', 40, false, false);
		if (dateAdded !== null && Number.isNaN(Date.parse(dateAdded))) fail('Date added must be a valid date.');

		return {
			name: textField(value.name, 'Name', 120, true, false),
			address: textField(value.address, 'Address', 240, false, false),
			zip_code: zipCode,
			sqft: integerField(value.sqft, 'Square footage', 1),
			monthly_rent: integerField(value.monthly_rent, 'Monthly rent', 0),
			has_driveway: booleanField(value.has_driveway, 'Has driveway'),
			has_outdoor_space: booleanField(value.has_outdoor_space, 'Has outdoor space'),
			has_kitchen_area: booleanField(value.has_kitchen_area, 'Has kitchen area'),
			zoning_clear: booleanField(value.zoning_clear, 'Zoning clear'),
			parking_spots: integerField(value.parking_spots === undefined ? 0 : value.parking_spots, 'Parking spots', 0),
			status: status,
			date_added: dateAdded,
			notes: textField(value.notes, 'Notes', 500, false, false),
		};
	}

	function normalizeSiteList(value) {
		if (!Array.isArray(value)) fail('Site data must be an array.');
		if (value.length > MAX_SITES) fail('Site data cannot contain more than ' + MAX_SITES + ' sites.');
		return value.map(normalizeSite);
	}

	function parseSiteList(source) {
		return normalizeSiteList(JSON.parse(source));
	}

	function cloneFallback(fallback) {
		return fallback.map(function (site) { return Object.assign({}, site); });
	}

	function loadSites(storage, key, fallback) {
		try {
			var saved = storage.getItem(key);
			if (saved === null) return { sites: cloneFallback(fallback), warning: null };
			return { sites: parseSiteList(saved), warning: null };
		} catch (error) {
			return {
				sites: cloneFallback(fallback),
				warning: 'Saved data could not be loaded. The built-in demo sites are shown instead.',
			};
		}
	}

	function commitSites(storage, key, nextSites) {
		try {
			var normalized = normalizeSiteList(nextSites);
			storage.setItem(key, JSON.stringify(normalized));
			return { ok: true, sites: normalized };
		} catch (error) {
			return { ok: false, error: 'Changes could not be saved in this browser.' };
		}
	}

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	root.AlphaSiteData = Object.freeze({
		MAX_IMPORT_BYTES: MAX_IMPORT_BYTES,
		MAX_SITES: MAX_SITES,
		STATUSES: Object.freeze(STATUSES.slice()),
		commitSites: commitSites,
		escapeHtml: escapeHtml,
		loadSites: loadSites,
		normalizeSite: normalizeSite,
		normalizeSiteList: normalizeSiteList,
		parseSiteList: parseSiteList,
	});
}(typeof globalThis !== 'undefined' ? globalThis : this));
