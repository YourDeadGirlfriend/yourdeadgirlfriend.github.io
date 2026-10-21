'use strict';
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
const MAX_ROWS = 10;
const Y_TOLERANCE = 3.5;
const HEADER_CLUSTER_TOLERANCE = 30;
const WRAPPED_LINE_MAX_DISTANCE = 16;
const TABLE_FIELDS = ['region', 'municipality', 'settlement', 'locality', 'address', 'phone'];
let allRecords = [];
let filteredRecords = [];
let tableExpanded = false;
let pdfLoaded = false;
let amChartRoot = null;
let amChartSeries = null;
let mapReady = false;
const regionCounts = Object.create(null);

const regionNameMap = {
    'Республика Адыгея': 'Адыгея',
    'Республика Башкортостан': 'Башкортостан',
    'Республика Бурятия': 'Бурятия',
    'Республика Дагестан': 'Дагестан',
    'Республика Ингушетия': 'Ингушетия',
    'Кабардино-Балкарская Республика': 'Кабардино-Балкарская Республика',
    'Республика Калмыкия': 'Калмыкия',
    'Карачаево-Черкесская Республика': 'Карачаево-Черкесская Республика',
    'Республика Карелия': 'Карелия',
    'Республика Коми': 'Коми',
    'Республика Марий Эл': 'Марий Эл',
    'Республика Мордовия': 'Мордовия',
    'Республика Саха (Якутия)': 'Саха (Якутия)',
    'Республика Северная Осетия-Алания': 'Северная Осетия — Алания',
    'Республика Татарстан': 'Татарстан',
    'Республика Тыва': 'Тыва',
    'Удмуртская Республика': 'Удмуртская Республика',
    'Республика Хакасия': 'Хакасия',
    'Чеченская Республика': 'Чеченская Республика',
    'Чувашская Республика': 'Чувашская Республика',
    'Алтайский край': 'Алтайский край',
    'Краснодарский край': 'Краснодарский край',
    'Красноярский край': 'Красноярский край',
    'Приморский край': 'Приморский край',
    'Ставропольский край': 'Ставропольский край',
    'Хабаровский край': 'Хабаровский край',
    'Амурская область': 'Амурская область',
    'Архангельская область': 'Архангельская область',
    'Астраханская область': 'Астраханская область',
    'Белгородская область': 'Белгородская область',
    'Брянская область': 'Брянская область',
    'Владимирская область': 'Владимирская область',
    'Волгоградская область': 'Волгоградская область',
    'Вологодская область': 'Вологодская область',
    'Воронежская область': 'Воронежская область',
    'Ивановская область': 'Ивановская область',
    'Иркутская область': 'Иркутская область',
    'Калининградская область': 'Калининградская область',
    'Калужская область': 'Калужская область',
    'Кемеровская область': 'Кемеровская область',
    'Кировская область': 'Кировская область',
    'Костромская область': 'Костромская область',
    'Курганская область': 'Курганская область',
    'Курская область': 'Курская область',
    'Ленинградская область': 'Ленинградская область',
    'Липецкая область': 'Липецкая область',
    'Магаданская область': 'Магаданская область',
    'Московская область': 'Московская область',
    'Мурманская область': 'Мурманская область',
    'Нижегородская область': 'Нижегородская область',
    'Новгородская область': 'Новгородская область',
    'Новосибирская область': 'Новосибирская область',
    'Омская область': 'Омская область',
    'Оренбургская область': 'Оренбургская область',
    'Орловская область': 'Орловская область',
    'Пензенская область': 'Пензенская область',
    'Пермский край': 'Пермский край',
    'Псковская область': 'Псковская область',
    'Ростовская область': 'Ростовская область',
    'Рязанская область': 'Рязанская область',
    'Самарская область': 'Самарская область',
    'Саратовская область': 'Саратовская область',
    'Сахалинская область': 'Сахалинская область',
    'Свердловская область': 'Свердловская область',
    'Смоленская область': 'Смоленская область',
    'Тамбовская область': 'Тамбовская область',
    'Тверская область': 'Тверская область',
    'Томская область': 'Томская область',
    'Тульская область': 'Тульская область',
    'Тюменская область': 'Тюменская область',
    'Ульяновская область': 'Ульяновская область',
    'Челябинская область': 'Челябинская область',
    'Забайкальский край': 'Забайкальский край',
    'Ярославская область': 'Ярославская область',
    'Еврейская автономная область': 'Еврейская автономная область',
    'Ненецкий автономный округ': 'Ненецкий автономный округ',
    'Ханты-Мансийский автономный округ - Югра': 'Ханты-Мансийский АО',
    'Чукотский автономный округ': 'Чукотский автономный округ',
    'Ямало-Ненецкий автономный округ': 'Ямало-Ненецкий АО',
    'Москва': 'Москва',
    'Санкт-Петербург': 'Санкт-Петербург',
    'Республика Алтай': 'Республика Алтай',
    'Камчатский край': 'Камчатский край'
};

const englishRegionAliases = {
    'Adygeya': 'Адыгея', 'Republic of Adygea': 'Адыгея',
    'Bashkortostan': 'Башкортостан', 'Republic of Bashkortostan': 'Башкортостан',
    'Buryatia': 'Бурятия', 'Republic of Buryatia': 'Бурятия',
    'Dagestan': 'Дагестан', 'Republic of Dagestan': 'Дагестан',
    'Ingushetia': 'Ингушетия', 'Republic of Ingushetia': 'Ингушетия',
    'Kabardino-Balkaria': 'Кабардино-Балкарская Республика',
    'Karachay-Cherkessia': 'Карачаево-Черкесская Республика',
    'Kalmykia': 'Калмыкия', 'Republic of Kalmykia': 'Калмыкия',
    'Karelia': 'Карелия', 'Komi': 'Коми', 'Mari El': 'Марий Эл',
    'Mordovia': 'Мордовия', 'Sakha': 'Саха (Якутия)', 'Yakutia': 'Саха (Якутия)',
    'North Ossetia-Alania': 'Северная Осетия — Алания',
    'Tatarstan': 'Татарстан', 'Tuva': 'Тыва', 'Tyva': 'Тыва',
    'Udmurtia': 'Удмуртская Республика', 'Khakassia': 'Хакасия',
    'Chechnya': 'Чеченская Республика', 'Chuvashia': 'Чувашская Республика',
    'Altai Republic': 'Республика Алтай', 'Altay Republic': 'Республика Алтай',
    'Altai Krai': 'Алтайский край', 'Altayskiy kray': 'Алтайский край',
    'Krasnodar Krai': 'Краснодарский край', 'Krasnoyarsk Krai': 'Красноярский край',
    'Primorsky Krai': 'Приморский край', 'Stavropol Krai': 'Ставропольский край',
    'Khabarovsk Krai': 'Хабаровский край', 'Kamchatka Krai': 'Камчатский край',
    'Amur Oblast': 'Амурская область', 'Arkhangelsk Oblast': 'Архангельская область',
    'Astrakhan Oblast': 'Астраханская область', 'Belgorod Oblast': 'Белгородская область',
    'Bryansk Oblast': 'Брянская область', 'Vladimir Oblast': 'Владимирская область',
    'Volgograd Oblast': 'Волгоградская область', 'Vologda Oblast': 'Вологодская область',
    'Voronezh Oblast': 'Воронежская область', 'Ivanovo Oblast': 'Ивановская область',
    'Irkutsk Oblast': 'Иркутская область', 'Kaliningrad Oblast': 'Калининградская область',
    'Kaluga Oblast': 'Калужская область', 'Kemerovo Oblast': 'Кемеровская область',
    'Kirov Oblast': 'Кировская область', 'Kostroma Oblast': 'Костромская область',
    'Kurgan Oblast': 'Курганская область', 'Kursk Oblast': 'Курская область',
    'Leningrad Oblast': 'Ленинградская область', 'Lipetsk Oblast': 'Липецкая область',
    'Magadan Oblast': 'Магаданская область', 'Moscow Oblast': 'Московская область',
    'Murmansk Oblast': 'Мурманская область', 'Nizhny Novgorod Oblast': 'Нижегородская область',
    'Novgorod Oblast': 'Новгородская область', 'Novosibirsk Oblast': 'Новосибирская область',
    'Omsk Oblast': 'Омская область', 'Orenburg Oblast': 'Оренбургская область',
    'Oryol Oblast': 'Орловская область', 'Penza Oblast': 'Пензенская область',
    'Perm Krai': 'Пермский край', 'Pskov Oblast': 'Псковская область',
    'Rostov Oblast': 'Ростовская область', 'Ryazan Oblast': 'Рязанская область',
    'Samara Oblast': 'Самарская область', 'Saratov Oblast': 'Саратовская область',
    'Sakhalin Oblast': 'Сахалинская область', 'Sverdlovsk Oblast': 'Свердловская область',
    'Smolensk Oblast': 'Смоленская область', 'Tambov Oblast': 'Тамбовская область',
    'Tver Oblast': 'Тверская область', 'Tomsk Oblast': 'Томская область',
    'Tula Oblast': 'Тульская область', 'Tyumen Oblast': 'Тюменская область',
    'Ulyanovsk Oblast': 'Ульяновская область', 'Chelyabinsk Oblast': 'Челябинская область',
    'Zabaykalsky Krai': 'Забайкальский край', 'Yaroslavl Oblast': 'Ярославская область',
    'Jewish Autonomous Oblast': 'Еврейская автономная область',
    'Nenets Autonomous Okrug': 'Ненецкий автономный округ',
    'Khanty-Mansi Autonomous Okrug': 'Ханты-Мансийский АО',
    'Chukotka Autonomous Okrug': 'Чукотский автономный округ',
    'Yamalo-Nenets Autonomous Okrug': 'Ямало-Ненецкий АО',
    'Moscow': 'Москва', 'Moskva': 'Москва',
    'Saint Petersburg': 'Санкт-Петербург', 'St. Petersburg': 'Санкт-Петербург',
    'Republic of Altai': 'Республика Алтай'
};

const geoIdToRegion = {
    'RU-AD': 'Адыгея', 'RU-BA': 'Башкортостан', 'RU-BU': 'Бурятия',
    'RU-DA': 'Дагестан', 'RU-IN': 'Ингушетия', 'RU-KB': 'Кабардино-Балкарская Республика',
    'RU-KC': 'Карачаево-Черкесская Республика', 'RU-KL': 'Калмыкия',
    'RU-KR': 'Карелия', 'RU-KO': 'Коми', 'RU-ME': 'Марий Эл', 'RU-MO': 'Мордовия',
    'RU-SA': 'Саха (Якутия)', 'RU-SE': 'Северная Осетия — Алания', 'RU-TA': 'Татарстан',
    'RU-TY': 'Тыва', 'RU-UD': 'Удмуртская Республика', 'RU-KK': 'Хакасия',
    'RU-CE': 'Чеченская Республика', 'RU-CU': 'Чувашская Республика',
    'RU-AL': 'Республика Алтай', 'RU-ALT': 'Алтайский край',
    'RU-KDA': 'Краснодарский край', 'RU-KYA': 'Красноярский край',
    'RU-PRI': 'Приморский край', 'RU-STA': 'Ставропольский край',
    'RU-KHA': 'Хабаровский край', 'RU-KAM': 'Камчатский край',
    'RU-AMU': 'Амурская область', 'RU-ARK': 'Архангельская область',
    'RU-AST': 'Астраханская область', 'RU-BEL': 'Белгородская область',
    'RU-BRY': 'Брянская область', 'RU-VLA': 'Владимирская область',
    'RU-VGG': 'Волгоградская область', 'RU-VLG': 'Вологодская область',
    'RU-VOR': 'Воронежская область', 'RU-IVA': 'Ивановская область',
    'RU-IRK': 'Иркутская область', 'RU-KGD': 'Калининградская область',
    'RU-KLU': 'Калужская область', 'RU-KEM': 'Кемеровская область',
    'RU-KIR': 'Кировская область', 'RU-KOS': 'Костромская область',
    'RU-KGN': 'Курганская область', 'RU-KRS': 'Курская область',
    'RU-LEN': 'Ленинградская область', 'RU-LIP': 'Липецкая область',
    'RU-MAG': 'Магаданская область', 'RU-MOS': 'Московская область',
    'RU-MUR': 'Мурманская область', 'RU-NIZ': 'Нижегородская область',
    'RU-NGR': 'Новгородская область', 'RU-NVS': 'Новосибирская область',
    'RU-OMS': 'Омская область', 'RU-ORE': 'Оренбургская область',
    'RU-ORL': 'Орловская область', 'RU-PNZ': 'Пензенская область',
    'RU-PER': 'Пермский край', 'RU-PSK': 'Псковская область',
    'RU-ROS': 'Ростовская область', 'RU-RYA': 'Рязанская область',
    'RU-SAK': 'Сахалинская область', 'RU-SAM': 'Самарская область',
    'RU-SAR': 'Саратовская область', 'RU-SVE': 'Свердловская область',
    'RU-SMO': 'Смоленская область', 'RU-TAM': 'Тамбовская область',
    'RU-TOM': 'Томская область', 'RU-TUL': 'Тульская область',
    'RU-TVE': 'Тверская область', 'RU-TYU': 'Тюменская область',
    'RU-ULY': 'Ульяновская область', 'RU-CHE': 'Челябинская область',
    'RU-ZAB': 'Забайкальский край', 'RU-YAR': 'Ярославская область',
    'RU-YEV': 'Еврейская автономная область', 'RU-NEN': 'Ненецкий автономный округ',
    'RU-KHM': 'Ханты-Мансийский АО', 'RU-CHU': 'Чукотский автономный округ',
    'RU-YAN': 'Ямало-Ненецкий АО', 'RU-MOW': 'Москва', 'RU-SPE': 'Санкт-Петербург'
};

function normalizeText(value) {
    return String(value ?? '').replace(/ё/gi, 'е').replace(/[‐‑‒–—−]/g, '-').replace(/[\u00A0\s]+/g, ' ').trim().toLocaleLowerCase('ru-RU');
}
const regionAliases = new Map();
function registerRegionAlias(alias, canonical) {
    const normalized = normalizeText(alias);
    if (normalized) regionAliases.set(normalized, canonical);
}
Object.entries(regionNameMap).forEach(([sourceName, displayName]) => {
    registerRegionAlias(sourceName, displayName);
    registerRegionAlias(displayName, displayName);
});
Object.entries(englishRegionAliases).forEach(([sourceName, displayName]) => {
    registerRegionAlias(sourceName, displayName);
});
const regionAliasList = [...regionAliases.entries()].sort((a, b) => b[0].length - a[0].length);

function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function aliasToRegex(alias) { return escapeRegExp(alias).replace(/ /g, '[\\s\\u00A0]+').replace(/-/g, '[-–—−]').replace(/ё/gi, '[её]'); }

function findRegionInText(text) {
    const source = String(text ?? '');
    for (const [normalizedAlias, canonical] of regionAliasList) {
        const regex = new RegExp(aliasToRegex(normalizedAlias), 'i');
        const match = regex.exec(normalizeText(source));
        if (match) {
            const flexible = new RegExp(aliasToRegex(normalizedAlias), 'i');
            const originalMatch = flexible.exec(source);
            return { name: canonical, matchedText: originalMatch ? originalMatch[0] : match[0], index: originalMatch ? originalMatch.index : -1 };
        }
    }
    return null;
}

function resolveRegionName(name) {
    const raw = String(name ?? '').trim();
    if (!raw) return '';
    const id = raw.toUpperCase();
    if (geoIdToRegion[id]) return geoIdToRegion[id];
    if (geoIdToRegion[id.startsWith('RU-') ? id : `RU-${id}`]) return geoIdToRegion[id.startsWith('RU-') ? id : `RU-${id}`];
    const normalized = normalizeText(raw);
    if (regionAliases.has(normalized)) return regionAliases.get(normalized);
    for (const [alias, canonical] of regionAliasList) {
        if (normalized.includes(alias) || alias.includes(normalized)) return canonical;
    }
    return raw;
}

function groupItemsIntoRows(items) {
    const valid = (items || []).filter(item => item && typeof item.str === 'string' && item.transform && item.transform.length >= 6);
    valid.sort((a, b) => Number(b.transform[5]) - Number(a.transform[5]) || Number(a.transform[4]) - Number(b.transform[4]));
    const rows = [];
    for (const item of valid) {
        const y = Number(item.transform[5]);
        let row = rows[rows.length - 1];
        if (!row || Math.abs(y - row.y) > Y_TOLERANCE) { row = { y, items: [] }; rows.push(row); }
        row.items.push(item);
        row.y = row.items.reduce((sum, part) => sum + Number(part.transform[5]), 0) / row.items.length;
    }
    rows.forEach(row => row.items.sort((a, b) => Number(a.transform[4]) - Number(b.transform[4])));
    return rows;
}

function getHeaderField(text) {
    const value = normalizeText(text).replace(/[.:;]+$/g, '').trim();
    if (/^субъект(?:\s+рф)?(?:\s|$)/.test(value)) return 'region';
    if (/^муниципальн/.test(value)) return 'municipality';
    if (/^поселение(?:\s|$)/.test(value)) return 'settlement';
    if (/^населенный(?:\s|$)/.test(value)) return 'locality';
    if (/^адрес(?:\s|$)/.test(value)) return 'address';
    if (/^абонентск/.test(value) || /^номер\s+телефона(?:\s|$)/.test(value) || /^телефон(?:\s|$)/.test(value)) return 'phone';
    return '';
}

function detectColumnLayout(rows) {
    const allItems = rows.flatMap((row, rowIndex) => row.items.map(item => ({ item, rowIndex, x: Number(item.transform[4]) || 0, y: Number(item.transform[5]) || 0, field: getHeaderField(item.str) })));
    if (!allItems.length) return null;
    const ys = allItems.map(item => item.y);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const topCutoff = minY + (maxY - minY) * 0.52;
    const candidates = allItems.filter(item => item.field && item.y >= topCutoff);
    if (candidates.length < 6) return null;
    let best = null;
    for (const seed of candidates) {
        const nearby = candidates.filter(candidate => Math.abs(candidate.y - seed.y) <= HEADER_CLUSTER_TOLERANCE);
        const byField = new Map();
        for (const candidate of nearby) {
            const current = byField.get(candidate.field);
            if (!current || Math.abs(candidate.y - seed.y) < Math.abs(current.y - seed.y)) byField.set(candidate.field, candidate);
        }
        const score = byField.size;
        const meanY = [...byField.values()].reduce((sum, item) => sum + item.y, 0) / Math.max(score, 1);
        if (!best || score > best.score || (score === best.score && meanY > best.meanY)) best = { score, meanY, byField };
    }
    if (!best || TABLE_FIELDS.some(field => !best.byField.has(field))) return null;
    const headerItems = TABLE_FIELDS.map(field => best.byField.get(field));
    const starts = headerItems.map(item => item.x);
    if (starts.some((value, index) => index > 0 && value <= starts[index - 1] + 10)) return null;
    return { starts, headerMinY: Math.min(...headerItems.map(item => item.y)), headerMaxY: Math.max(...headerItems.map(item => item.y)), headerRowIndexes: new Set(headerItems.map(item => item.rowIndex)) };
}

function cleanCellText(value) {
    return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[\u00A0\t\r\n]+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/([,;])(?=\S)/g, '$1 ').replace(/\s{2,}/g, ' ').trim();
}

function joinTextItems(items) {
    const ordered = [...items].sort((a, b) => Number(a.transform[4]) - Number(b.transform[4]));
    let output = '';
    for (const item of ordered) {
        const text = String(item.str ?? '').trim();
        if (!text) continue;
        if (!output) output = text;
        else if (/^[,.;:!?%)\]}]/.test(text)) output = output.trimEnd() + text;
        else if (/[[({/-]$/.test(output.trimEnd())) output = output.trimEnd() + text;
        else output += ` ${text}`;
    }
    return cleanCellText(output);
}

function assignItemsToColumns(row, layout) {
    const boundaries = [];
    for (let i = 0; i < layout.starts.length - 1; i++) boundaries.push((layout.starts[i] + layout.starts[i + 1]) / 2);
    const buckets = TABLE_FIELDS.map(() => []);
    for (const item of row.items) {
        const x = Number(item.transform[4]) || 0;
        let column = boundaries.findIndex(boundary => x < boundary);
        if (column < 0) column = TABLE_FIELDS.length - 1;
        buckets[column].push(item);
    }
    return buckets.map(joinTextItems);
}

function isNoiseTableRow(cells) {
    const normalizedCells = cells.map(cell => normalizeText(cell));
    const text = normalizeText(cells.join(' '));
    if (!text || /^\d+$/.test(text)) return true;
    const exactHeaderCells = new Set(['субъект рф', 'субъект', 'муниципальное образование', 'поселение', 'населенный пункт', 'адрес размещения', 'абонентский номер', 'номер телефона']);
    if (normalizedCells.filter(cell => exactHeaderCells.has(cell)).length >= 2) return true;
    const noisePrefixes = ['адресный перечень', 'перечень универсальных услуг', 'реестр универсальных услуг', 'страница документа', 'всего таксофонов'];
    if (noisePrefixes.some(prefix => text.startsWith(prefix))) return true;
    return false;
}

function findPhoneInText(text, allowLocalTenDigits = false) {
    const source = String(text ?? '');
    const nationalRegex = /(^|[^\d])((?:\+7|8)(?:[\s().-]*\d){10})(?!\d)/g;
    let match;
    while ((match = nationalRegex.exec(source)) !== null) {
        const phoneText = match[2].trim();
        const digits = phoneText.replace(/\D/g, '');
        if (digits.length !== 11 || !/^[78]/.test(digits)) continue;
        const start = match.index + match[1].length;
        return { phone: phoneText.replace(/\s+/g, ' '), start, end: start + phoneText.length, before: source.slice(0, start).replace(/[\s,;|]+$/g, '').trim() };
    }
    if (allowLocalTenDigits) {
        const localRegex = /(^|[^\d])((?:\d[\s().-]*){9}\d)(?!\d)/g;
        while ((match = localRegex.exec(source)) !== null) {
            const phoneText = match[2].trim();
            if (phoneText.replace(/\D/g, '').length !== 10) continue;
            const start = match.index + match[1].length;
            return { phone: phoneText.replace(/\s+/g, ' '), start, end: start + phoneText.length, before: source.slice(0, start).replace(/[\s,;|]+$/g, '').trim() };
        }
    }
    return null;
}

function findPhoneInCells(cells) {
    for (let index = cells.length - 1; index >= 0; index--) {
        const match = findPhoneInText(cells[index], index === 5);
        if (match) return { ...match, column: index };
    }
    return null;
}

function joinCellSegments(segments) {
    const unique = [];
    for (const raw of segments) {
        const value = cleanCellText(raw);
        if (!value) continue;
        const norm = normalizeText(value);
        if (unique.some(existing => normalizeText(existing) === norm)) continue;
        const containingIndex = unique.findIndex(existing => { const previous = normalizeText(existing); return previous.includes(norm) || norm.includes(previous); });
        if (containingIndex >= 0) { if (value.length > unique[containingIndex].length) unique[containingIndex] = value; continue; }
        unique.push(value);
    }
    let output = '';
    for (const part of unique) {
        if (!output) output = part;
        else if (/[-‐‑‒–—]$/.test(output) && /^[а-яё]/i.test(part)) output = output.slice(0, -1) + part;
        else if (/^[,.;:!?)\]]/.test(part)) output = output.trimEnd() + part;
        else output += ` ${part}`;
    }
    return cleanCellText(output);
}

function canonicalRegion(value) {
    const text = cleanCellText(value);
    if (!text) return '';
    const match = findRegionInText(text);
    if (match) return match.name;
    const exact = regionAliases.get(normalizeText(text));
    return exact || text;
}

function recognizedRegion(value) {
    const text = cleanCellText(value);
    if (!text) return '';
    const match = findRegionInText(text);
    if (match) return match.name;
    return regionAliases.get(normalizeText(text)) || '';
}

function updateHierarchyContext(cells, context) {
    const candidateRegion = recognizedRegion(cells[0]);
    if (candidateRegion && normalizeText(candidateRegion) !== normalizeText(context.region)) {
        context.region = candidateRegion; context.municipality = ''; context.settlement = ''; context.locality = '';
    }
    const values = ['municipality', 'settlement', 'locality'];
    const indexes = [1, 2, 3];
    for (let i = 0; i < indexes.length; i++) {
        const field = values[i];
        const value = cleanCellText(cells[indexes[i]]);
        if (!value) continue;
        if (context[field] && normalizeText(context[field]) !== normalizeText(value)) {
            if (field === 'municipality') { context.settlement = ''; context.locality = ''; }
            else if (field === 'settlement') { context.locality = ''; }
        }
        context[field] = value;
    }
}

function extractRecordsFromPage(items, pageNumber, firstId, previousLayout, context) {
    const rows = groupItemsIntoRows(items);
    const detected = detectColumnLayout(rows);
    const layout = detected || previousLayout;
    if (!layout) return { records: [], nextId: firstId, layout: null, detectedHeaders: false };
    const mappedRows = [];
    for (const row of rows) {
        if (detected && row.y >= detected.headerMinY - 3) continue;
        const cells = assignItemsToColumns(row, layout);
        if (isNoiseTableRow(cells)) continue;
        if (!cells.some(cell => cell.trim())) continue;
        mappedRows.push({ y: row.y, cells, phoneInfo: findPhoneInCells(cells), supplemental: false });
    }
    const phoneRows = mappedRows.filter(row => row.phoneInfo);
    const supplementalFor = new Map(phoneRows.map(row => [row, []]));
    for (const row of mappedRows) {
        if (row.phoneInfo || !phoneRows.length) continue;
        let nearest = null, nearestDistance = Infinity, secondDistance = Infinity;
        for (const phoneRow of phoneRows) {
            const distance = Math.abs(phoneRow.y - row.y);
            if (distance < nearestDistance) { secondDistance = nearestDistance; nearestDistance = distance; nearest = phoneRow; }
            else if (distance < secondDistance) { secondDistance = distance; }
        }
        const clearlyNearest = secondDistance === Infinity || nearestDistance + 2 < secondDistance * 0.8;
        if (nearest && nearestDistance <= WRAPPED_LINE_MAX_DISTANCE && clearlyNearest) {
            supplementalFor.get(nearest).push(row);
            row.supplemental = true;
        }
    }
    const records = [];
    for (const row of mappedRows) {
        if (row.supplemental) continue;
        if (!row.phoneInfo) {
            const hierarchyOnly = row.cells.slice(4).every(cell => !cleanCellText(cell)) && row.cells.slice(0, 4).some(cell => cleanCellText(cell));
            if (hierarchyOnly) updateHierarchyContext(row.cells, context);
            continue;
        }
        const relatedRows = [row, ...(supplementalFor.get(row) || [])].sort((a, b) => b.y - a.y);
        const cells = TABLE_FIELDS.map((_, index) => joinCellSegments(relatedRows.map(item => item.cells[index])));
        const phoneInfo = findPhoneInCells(cells) || row.phoneInfo;
        if (phoneInfo) cells[phoneInfo.column] = phoneInfo.before;
        updateHierarchyContext(cells, context);
        const phone = phoneInfo ? phoneInfo.phone : '';
        records.push({
            page: pageNumber, id: firstId + records.length,
            region: recognizedRegion(cells[0]) || context.region || canonicalRegion(cells[0]),
            municipality: cleanCellText(cells[1]) || context.municipality,
            settlement: cleanCellText(cells[2]) || context.settlement,
            locality: cleanCellText(cells[3]) || context.locality,
            address: cleanCellText(cells[4]), phone, rawCells: cells
        });
    }
    return { records, nextId: firstId + records.length, layout, detectedHeaders: Boolean(detected) };
}

function clearRegionCounts() { Object.keys(regionCounts).forEach(key => delete regionCounts[key]); }
function rebuildRegionCounts() { clearRegionCounts(); for (const record of allRecords) { if (record.region) regionCounts[record.region] = (regionCounts[record.region] || 0) + 1; } }

document.addEventListener('DOMContentLoaded', () => {
    initAmChart(); setupUpload(); setupFilters(); setupMapDownload(); renderTable(); updateAnalytics();
});

function toggleSection(id) {
    const number = String(id).replace('section', '');
    const content = document.getElementById(`content${number}`);
    const toggle = document.getElementById(`toggle${number}`);
    if (content) content.classList.toggle('hidden');
    if (toggle) toggle.classList.toggle('collapsed');
}

function updateTableExpandButton() {
    const button = document.getElementById('toggleTableBtn');
    if (!button) return;
    const canExpand = pdfLoaded && filteredRecords.length > MAX_ROWS;
    button.hidden = !canExpand;
    button.textContent = tableExpanded ? 'Свернуть до 10 строк' : `Показать все строки (${filteredRecords.length})`;
}

function toggleTableExpand() { tableExpanded = !tableExpanded; renderTable(); }

function setupUpload() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');
    const deleteButton = document.getElementById('deleteBtn');
    if (!zone || !input || !deleteButton) return;
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); } });
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('dragover'); if (event.dataTransfer?.files?.length) handleFile(event.dataTransfer.files[0]); });
    input.addEventListener('change', event => { if (event.target.files?.length) handleFile(event.target.files[0]); });
    deleteButton.addEventListener('click', () => {
        allRecords = []; filteredRecords = []; pdfLoaded = false; tableExpanded = false; input.value = '';
        clearRegionCounts(); updateUI(); deleteButton.style.display = 'none';
        document.getElementById('progressInfo').textContent = 'Ожидается PDF.';
    });
}

async function handleFile(file) {
    if (!file || !/.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) { alert('Выберите PDF-файл.'); return; }
    if (typeof pdfjsLib === 'undefined') { alert('PDF.js не загрузился. Проверьте подключение к интернету.'); return; }
    const progress = document.getElementById('progressInfo');
    const deleteButton = document.getElementById('deleteBtn');
    progress.textContent = 'Чтение файла...';
    deleteButton.style.display = 'inline-block';
    allRecords = []; filteredRecords = []; pdfLoaded = false; tableExpanded = false;
    clearRegionCounts(); renderTable(); updateAnalytics(); updateAmChart();
    try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const totalPages = pdf.numPages;
        let recordId = 1, layout = null;
        const hierarchyContext = { region: '', municipality: '', settlement: '', locality: '' };
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            progress.textContent = `Обработка страницы ${pageNumber} из ${totalPages}...`;
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const result = extractRecordsFromPage(content.items, pageNumber, recordId, layout, hierarchyContext);
            if (result.layout) layout = result.layout;
            allRecords.push(...result.records);
            recordId = result.nextId;
        }
        pdfLoaded = true;
        rebuildRegionCounts();
        updateUI();
        if (!layout) progress.textContent = 'Не удалось найти заголовки шести колонок.';
        else if (!allRecords.length) progress.textContent = 'Заголовки найдены, но номера телефонов не распознаны.';
        else progress.textContent = `Готово! Извлечено ${allRecords.length} записей.`;
    } catch (error) {
        console.error('Ошибка обработки PDF:', error);
        progress.textContent = 'Ошибка чтения PDF. Подробности — в консоли браузера (F12).';
        allRecords = []; filteredRecords = []; pdfLoaded = false; tableExpanded = false;
        clearRegionCounts(); updateUI();
    }
}

function initAmChart() {
    const mapElement = document.getElementById('russiaMap');
    if (!mapElement) return;
    if (typeof am5 === 'undefined' || typeof am5map === 'undefined' || typeof am5geodata_russiaLow === 'undefined') {
        mapElement.textContent = 'Не удалось загрузить карту. Проверьте подключение к интернету.';
        mapElement.classList.add('map-error');
        return;
    }
    try {
        const root = am5.Root.new('russiaMap');
        const chart = root.container.children.push(am5map.MapChart.new(root, {
            panX: 'translateX', panY: 'translateY', projection: am5map.geoMercator(),
            homeGeoPoint: { longitude: 100, latitude: 65 }, homeZoomLevel: 1.8
        }));
        const series = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_russiaLow, exclude: ['AQ'] }));
        series.mapPolygons.template.setAll({ tooltipText: '{name}', interactive: true, fill: am5.color(0xF3F4F6), stroke: am5.color(0xFFFFFF), strokeWidth: 0.7 });
        series.mapPolygons.template.states.create('hover', { fill: am5.color(0xD1D5DB) });
        series.mapPolygons.template.events.on('click', event => {
            const context = event.target?.dataItem?.dataContext;
            const region = getGeoFeatureRegion(context);
            if (!region) { console.warn('Не удалось сопоставить регион на карте:', context); return; }
            const select = document.getElementById('filterRegion');
            if (select) {
                select.value = region; tableExpanded = false; applyFilters();
                document.getElementById('section2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        series.events.on('datavalidated', () => { mapReady = true; chart.goHome(); updateAmChart(); });
        amChartRoot = root; amChartSeries = series;
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
        mapElement.textContent = 'Ошибка инициализации карты. Откройте консоль (F12).';
        mapElement.classList.add('map-error');
    }
}

function getGeoFeatureRegion(context) {
    if (!context) return '';
    if (context.id) {
        const id = String(context.id).toUpperCase();
        if (geoIdToRegion[id]) return geoIdToRegion[id];
        if (geoIdToRegion[id.startsWith('RU-') ? id : `RU-${id}`]) return geoIdToRegion[id.startsWith('RU-') ? id : `RU-${id}`];
    }
    return resolveRegionName(context.name || context.NAME || '');
}

function getColor(count) {
    if (!count) return 0xF3F4F6;   // 0 — светло-серый
    if (count <= 150) return 0xBFDBFE; // 1–150 — светло-голубой
    if (count <= 350) return 0x60A5FA; // 151–350 — голубой
    if (count <= 600) return 0x2563EB; // 351–600 — насыщенный синий
    return 0x1E3A8A;                   // 601+ — тёмно-синий
}
function updateAmChart() {
    if (!amChartSeries || !mapReady || typeof am5 === 'undefined') return;
    amChartSeries.mapPolygons.each(polygon => {
        const context = polygon.dataItem?.dataContext;
        if (!context) return;
        const region = getGeoFeatureRegion(context);
        const count = regionCounts[region] || 0;
        polygon.set('fill', am5.color(getColor(count)));
        polygon.set('tooltipText', `${region || context.name || 'Регион'}: ${count.toLocaleString('ru-RU')} записей`);
    });
}

function setupMapDownload() {
    const button = document.getElementById('downloadMap');
    if (!button) return;
    button.addEventListener('click', async () => {
        if (!amChartRoot || !amChartSeries || !mapReady) { alert('Карта ещё не готова.'); return; }
        if (typeof am5plugins_exporting === 'undefined') { alert('Модуль экспорта не загрузился.'); return; }
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Подготовка PNG...';
        let exporting;
        try {
            exporting = am5plugins_exporting.Exporting.new(amChartRoot, { filePrefix: 'PayPhone2077-map', backgroundColor: am5.color(0xFFFFFF), pngOptions: { quality: 1, maintainPixelRatio: true } });
            await exporting.download('png');
        } catch (error) {
            console.error('Ошибка экспорта PNG:', error);
            alert('Не удалось скачать PNG.');
        } finally {
            if (exporting) exporting.dispose();
            button.disabled = false;
            button.textContent = originalText;
        }
    });
}

function setupFilters() {
    const region = document.getElementById('filterRegion');
    const applyButton = document.getElementById('applyFilters');
    const resetButton = document.getElementById('resetFilters');
    const applyAndCollapse = () => { tableExpanded = false; applyFilters(); };
    region?.addEventListener('change', applyAndCollapse);
    applyButton?.addEventListener('click', applyAndCollapse);
    resetButton?.addEventListener('click', () => { if (region) region.value = ''; tableExpanded = false; applyFilters(); });
}

function applyFilters() {
    const selectedRegion = document.getElementById('filterRegion')?.value || '';
    filteredRecords = allRecords.filter(record => !selectedRegion || record.region === selectedRegion);
    renderTable();
}

function appendCell(row, value, options = {}) {
    const cell = document.createElement('td');
    if (options.colSpan) cell.colSpan = options.colSpan;
    if (options.className) cell.className = options.className;
    cell.textContent = value == null ? '' : String(value);
    row.appendChild(cell);
    return cell;
}

function renderTable() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    tbody.replaceChildren();
    const resultCount = document.getElementById('resultsCount');
    const totalCount = document.getElementById('totalFiltered');
    if (!pdfLoaded) {
        const row = document.createElement('tr');
        appendCell(row, 'Загрузите PDF в секции 01', { colSpan: 6, className: 'empty-table-cell' });
        tbody.appendChild(row);
        if (resultCount) resultCount.textContent = '0';
        if (totalCount) totalCount.textContent = '0';
        updateTableExpandButton();
        return;
    }
    const records = filteredRecords;
    const visibleCount = tableExpanded ? records.length : Math.min(records.length, MAX_ROWS);
    if (!records.length) {
        const row = document.createElement('tr');
        appendCell(row, 'Нет записей по выбранному субъекту РФ.', { colSpan: 6, className: 'empty-table-cell' });
        tbody.appendChild(row);
    } else {
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < visibleCount; index++) {
            const record = records[index];
            const row = document.createElement('tr');
            appendCell(row, record.region);
            appendCell(row, record.municipality);
            appendCell(row, record.settlement);
            appendCell(row, record.locality);
            appendCell(row, record.address);
            const phoneCell = appendCell(row, record.phone, { className: 'phone-cell' });
            if (record.phone) {
                const strong = document.createElement('strong');
                strong.textContent = record.phone;
                phoneCell.replaceChildren(strong);
            }
            fragment.appendChild(row);
        }
        tbody.appendChild(fragment);
    }
    if (resultCount) resultCount.textContent = String(visibleCount);
    if (totalCount) totalCount.textContent = String(records.length);
    updateTableExpandButton();
}

function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = String(value); }

function updateUI() {
    rebuildRegionCounts();
    const uniqueRegions = [...new Set(allRecords.map(record => record.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
    const uniqueMunicipalities = new Set(allRecords.map(record => normalizeText(record.municipality)).filter(Boolean));
    const uniqueSettlements = new Set(allRecords.map(record => normalizeText(record.settlement)).filter(Boolean));
    setText('totalRows', allRecords.length);
    setText('uniqueRegions', uniqueRegions.length);
    setText('uniqueMunicipalities', uniqueMunicipalities.size);
    setText('uniqueSettlements', uniqueSettlements.size);
    const select = document.getElementById('filterRegion');
    if (select) {
        const previousValue = select.value;
        select.replaceChildren();
        const allOption = document.createElement('option');
        allOption.value = ''; allOption.textContent = 'Все субъекты РФ';
        select.appendChild(allOption);
        uniqueRegions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = `${region} (${regionCounts[region] || 0})`;
            select.appendChild(option);
        });
        select.value = uniqueRegions.includes(previousValue) ? previousValue : '';
    }
    applyFilters(); updateAnalytics(); updateAmChart();
}

function updateAnalytics() {
    const chart = document.getElementById('chartRegions');
    if (!chart) return;
    const sorted = Object.entries(regionCounts).filter(([name, count]) => name && count > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'));
    chart.replaceChildren();
    if (!sorted.length) {
        const empty = document.createElement('div');
        empty.className = 'chart-empty'; empty.textContent = 'Нет данных';
        chart.appendChild(empty);
        return;
    }
    const max = sorted[0][1] || 1;
    const fragment = document.createDocumentFragment();
    sorted.forEach(([name, count], index) => {
        const item = document.createElement('div');
        item.className = 'bar-item';
        const label = document.createElement('div');
        label.className = 'bar-label'; label.textContent = `${index + 1}. ${name}`;
        const bar = document.createElement('div');
        bar.className = 'bar';
        const fill = document.createElement('div');
        fill.className = 'bar-fill'; fill.style.width = `${(count / max) * 100}%`;
        bar.appendChild(fill);
        const value = document.createElement('div');
        value.className = 'bar-value'; value.textContent = count.toLocaleString('ru-RU');
        item.append(label, bar, value);
        fragment.appendChild(item);
    });
    chart.appendChild(fragment);
}