// ==UserScript==
// @name         Current RMS - Custom Shortcuts (Q/E/R/S/C/A)
// @namespace    http://tampermonkey.net/
// @version      4.4
// @description  Shift+Q/E=Prev/Next, Shift+R=Reset, Shift+S=Show picker, Shift+C=Create Quotation, Shift+A=Go to Job Planner
// @author       sota0916
// @match        https://*.current-rms.com/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    // ===== 日付ヘルパー =====
    function todayISO() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    function todayUS() {
        const d = new Date();
        return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
    }
    // ===== アクション =====
    function clickPrev() {
        const el = document.querySelector('a.list-button-left, button.last-time-period');
        if (el) el.click();
    }
    function clickNext() {
        const el = document.querySelector('a.list-button-right, button.next-time-period');
        if (el) el.click();
    }
    // フォーム経由で日付を変更する共通処理
    function submitDateForm(input) {
        input.value = todayUS();
        input.dispatchEvent(new Event('change', { bubbles: true }));
        const form = input.closest('form');
        const updateBtn =
            (form && form.querySelector('button[type="submit"], input[type="submit"]')) ||
            document.querySelector('button.submit-button');
        if (updateBtn) {
            updateBtn.click();
        } else if (form) {
            form.submit();
        }
    }
    function resetToToday() {
        const path = location.pathname;
        if (/^\/planner/.test(path)) {
            location.href = '/planner';
            return;
        }
        if (/^\/availability\/bookings/.test(path)) {
            const m = path.match(/^(\/availability\/bookings\/\d+)\/\d{4}-\d{2}-\d{2}(\/\d+)?/);
            if (m) {
                location.href = m[1] + '/' + todayISO() + (m[2] || '') + location.search;
                return;
            }
            const url = new URL(location.href);
            const key = 'booking_availability_view_options[starts_at]';
            if (url.searchParams.has(key)) {
                url.searchParams.set(key, todayISO());
                location.href = url.toString();
                return;
            }
            location.href = '/availability/bookings';
            return;
        }
        if (/^\/availability\/product/.test(path)) {
            const input = document.querySelector(
                '#product_availability_view_options_starts_at, input[name="product_availability_view_options[starts_at]"]'
            );
            if (input) {
                submitDateForm(input);
                return;
            }
            location.href = '/availability/product';
            return;
        }
        if (/^\/(calendar|resource_planner)/.test(path)) {
            const startsAt =
                document.querySelector('#starts_at') ||
                document.querySelector('input.ui-date-single-picker[name*="starts_at"]');
            if (startsAt) {
                submitDateForm(startsAt);
                return;
            }
        }
    }
    function openShowPicker() {
        const btn = document.getElementById('show_picker_button');
        if (btn) btn.click();
    }
    function createQuotation() {
        const createBtn = Array.from(document.querySelectorAll('button.dropdown-toggle'))
            .find(b => /^create$/i.test((b.textContent || '').trim()));
        if (!createBtn) return;
        const dropdown = createBtn.parentElement?.querySelector('.dropdown-menu');
        if (!dropdown) return;
        const quotationLink = Array.from(dropdown.querySelectorAll('a'))
            .find(a => /^quotation$/i.test((a.textContent || '').trim()));
        if (quotationLink) quotationLink.click();
    }
    function goToJobPlanner() {
        location.href = '/planner';
    }
    // ===== キーボードリスナー =====
    document.addEventListener('keydown', function(e) {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
        if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
        switch (e.key) {
            case 'Q': e.preventDefault(); clickPrev(); break;
            case 'E': e.preventDefault(); clickNext(); break;
            case 'R': e.preventDefault(); resetToToday(); break;
            case 'S': e.preventDefault(); openShowPicker(); break;
            case 'C': e.preventDefault(); createQuotation(); break;
            case 'A': e.preventDefault(); goToJobPlanner(); break;
        }
    }, true);
})();
