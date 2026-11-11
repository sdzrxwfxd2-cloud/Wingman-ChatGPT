function Timezone(_name, _desc, _offset) {
    this.name = _name;
    this.desc = _desc;
    this.offset = _offset;
}

var zone00 = new Timezone("UTC", "GMT, Western European", 0);
var zone01 = new Timezone("UTC+1", "Central European, West Africa", -1.0 * 3600);
var zone02 = new Timezone("UTC+2", "E. European, Cent. Africa, Israel", -2.0 * 3600);
var zone03 = new Timezone("UTC+3", "E. Africa, Arabic, Arab, Moscow", -3.0 * 3600);
var zone03p5 = new Timezone("UTC+3.5", "Iran ", -3.5 * 3600);
var zone04 = new Timezone("UTC+4", " Arabian, Georgia, Armenia, Azerb.", -4.0 * 3600);
var zone04p5 = new Timezone("UTC+4.5", "Afghanistan ", -4.5 * 3600);
var zone05 = new Timezone("UTC+5", "Pakistan, Yekaterinburg", -5.0 * 3600);
var zone05p5 = new Timezone("UTC+5.5", "Indian, Sri Lanka", -5.5 * 3600);
var zone06 = new Timezone("UTC+6", "Bhutan, Bangledesh, Omsk", -6.0 * 3600);
var zone07 = new Timezone("UTC+7", "Indochina, Thailand", -7.0 * 3600);
var zone08 = new Timezone("UTC+8", "China, Australian W., Hong Kong", -8.0 * 3600);
var zone09 = new Timezone("UTC+9", "Korea, Japan, Yakutsk", -9.0 * 3600);
var zone09p5 = new Timezone("UTC+9.5", "Australian Central", -9.5 * 3600);
var zone10 = new Timezone("UTC+10", "Australian E., Chamorro, Vladiv.", -10.0 * 3600);
var zone11 = new Timezone("UTC+11", "Magaden, Solomon Islands", -11.0 * 3600);
var zone12 = new Timezone("UTC+12", "Fiji, New Zealand, Kamchatka", -12.0 * 3600);
var zone13 = new Timezone("UTC-11", "Samoa, Midway Island", 11.0 * 3600);
var zone14 = new Timezone("UTC-10", "Hawaii, Cook Island", 10.0 * 3600);
var zone15 = new Timezone("UTC-9", "Alaska", 9.0 * 3600);
var zone16 = new Timezone("UTC-8", "Pacific", 8.0 * 3600);
var zone17 = new Timezone("UTC-7", "Mountain, Arizona", 7.0 * 3600);
var zone18 = new Timezone("UTC-6", "Central", 6.0 * 3600);
var zone19 = new Timezone("UTC-5", "Eastern, Colombia, Equador", 5.0 * 3600);
var zone20 = new Timezone("UTC-4", "Atlantic, Bolivia, Chile", 4.0 * 3600);
var zone20p5 = new Timezone("UTC-3.5", "Newfoundland", 3.5 * 3600);
var zone21 = new Timezone("UTC-3", "Argentina, Brasilia, Uruguay", 3.0 * 3600);
var zone22 = new Timezone("UTC-2", "Mid-Atlantic", 2.0 * 3600);
var zone23 = new Timezone("UTC-1", "Cape Verde, Azores", 1.0 * 3600);

// TIME_ZONE_UTC definition must match placement in Timezone[] below
CONST.TIME_ZONE_UTC = 12;

CONST.TIMEZONES = [
    zone13,
    zone14,
    zone15,
    zone16,
    zone17,
    zone18,
    zone19,
    zone20,
    zone20p5,
    zone21,
    zone22,
    zone23,
    zone00,
    zone01,
    zone02,
    zone03,
    zone03p5,
    zone04,
    zone04p5,
    zone05,
    zone05p5,
    zone06,
    zone07,
    zone08,
    zone09,
    zone09p5,
    zone10,
    zone11,
    zone12
];
