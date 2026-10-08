(function(){
  'use strict';
  var AMAZON_TAG='siebtraegergu-21';
  var FLAVORS=[
    {name:'Schokoladig',short:'Kakao',icon:'flavorChocolate',color:'#835039',copy:'Rund, kräftig und vertraut – häufig mit Kakao, Nuss und wenig Säure.'},
    {name:'Nussig',short:'Nuss',icon:'flavorNut',color:'#b27a43',copy:'Mild-warm und ausgewogen; passt oft gut zu Café Crema und Milch.'},
    {name:'Karamell & süß',short:'Süß',icon:'flavorSweet',color:'#d29645',copy:'Weiche Süße und ein runder Eindruck statt spitzer Säure.'},
    {name:'Fruchtig',short:'Frucht',icon:'flavorFruit',color:'#bf7656',copy:'Lebendig und aromatisch; eher hellere Röstungen lassen solche Noten hervortreten.'},
    {name:'Blumig',short:'Blüte',icon:'flavorFlower',color:'#a77d92',copy:'Duftig und fein – oft spannend bei Arabica und helleren Röstungen.'},
    {name:'Würzig',short:'Würze',icon:'flavorSpice',color:'#8e6549',copy:'Tiefe, würzige Noten mit Charakter; ein guter Kontrast in kräftigem Espresso.'},
    {name:'Röstig & bitter',short:'Röstig',icon:'flavorRoast',color:'#63402f',copy:'Dunkler, markanter Geschmack – besonders beliebt als Espresso und in Milch.'},
    {name:'Erdig',short:'Erdig',icon:'flavorEarth',color:'#718065',copy:'Vollmundig, dicht und eher herzhaft als fruchtig.'}
  ];
  var METHODS={
    espresso:{name:'Siebträger',icon:'portafilter',desc:'präzise, konzentrierte Shots'},
    automatic:{name:'Vollautomat',icon:'automatic',desc:'Kaffeespezialitäten auf Knopfdruck'},
    moka:{name:'Herdkanne / Mokka',icon:'moka',desc:'kräftig und aromatisch'},
    filter:{name:'Filterkaffee',icon:'filter',desc:'klar, weich und vielseitig'},
    french:{name:'French Press',icon:'french',desc:'voller Körper, unkompliziert'},
    cold:{name:'Cold Brew',icon:'cold',desc:'kalt extrahiert, sanft und süß'}
  };
  var ICON_SVGS={
    portafilter:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 15h21v8H7zM10 23l3 12h9l3-12M28 18h12v4H28M37 22v6"/><path d="M8 14l3-4h14l3 4M15 35h6"/></svg>',
    automatic:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 7h24v34H12zM17 12h14v9H17zM17 25h14M18 31h9M31 31h3v5h-3zM18 41v-4M30 41v-4"/><path d="M18 15h8M18 18h5"/></svg>',
    moka:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 16h19l-2 24H17zM14 16l4-5h13l4 5M20 11V7h9v4M34 21h6v12h-7M17 22h16M22 6h5"/></svg>',
    filter:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 8h34L29 29H19zM19 29h10l-2 5h-6zM24 34v4M15 40h18"/><path d="M12 13h24"/></svg>',
    french:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 12h22l-2 29H15zM11 12h26M24 5v22M19 27h10M18 36h12"/><path d="M35 17h4v15h-5"/></svg>',
    cold:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 10h22l-2 31H15zM11 10h26M19 16v7h7v-7M28 26l5 6M33 26l-5 6M19 31h5"/><path d="M18 6v4M30 6v4"/></svg>',
    blackCoffee:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 17h25v17a8 8 0 0 1-8 8h-9a8 8 0 0 1-8-8zM34 20h5a5 5 0 0 1 0 10h-5M7 44h34"/><path d="M15 12c-2-2 2-4 0-7M23 12c-2-2 2-4 0-7"/></svg>',
    milkCoffee:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 18h25v16a8 8 0 0 1-8 8h-9a8 8 0 0 1-8-8zM34 21h5a5 5 0 0 1 0 10h-5M7 44h34"/><path d="M10 21c3-6 7 2 11-3s7 4 13-1"/><circle cx="17" cy="25" r="1"/><circle cx="28" cy="23" r="1"/></svg>',
    bothCups:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 20h17v12a6 6 0 0 1-6 6h-5a6 6 0 0 1-6-6zM22 22h3a4 4 0 0 1 0 8h-3M4 40h24"/><path d="M27 14h16v13a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6zM43 16h2a4 4 0 0 1 0 8h-2M27 35h17"/><path d="M10 16c-2-2 2-3 0-6M34 10c-2-2 2-3 0-6"/></svg>',
    coffeeBean:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 5c10-3 22 6 24 17 3 11-4 21-14 22C18 45 7 36 5 25 3 16 9 8 19 5Z"/><path d="M17 7c8 8 12 16 11 23 0 6-3 10-6 14"/></svg>',
    groundCoffee:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 31h27l-3 11H12zM35 33h5a5 5 0 0 0 0-10h-4M14 28c2-7 12-7 14 0M19 18l-3-4M26 18l3-4M33 18l-2-4"/><path d="M11 31h21"/></svg>',
    arabicaBean:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40c1-14 7-26 19-31M14 39c2-9 8-17 19-22M20 39c4-5 8-8 15-10"/><path d="M11 28c-4-1-6-4-6-8 5 0 8 2 9 6M21 17c-3-3-3-7-1-11 4 3 5 6 4 10M27 12c0-4 2-7 6-9 1 5-1 8-4 10"/></svg>',
    blendBeans:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 8c7-2 13 3 13 9s-5 11-11 12S4 25 5 19s2-9 7-11ZM31 20c7-2 13 3 13 9s-5 11-11 12-10-4-9-10 2-9 7-11Z"/><path d="M11 9c4 4 5 8 4 12M30 21c4 4 5 8 4 12M21 13l5 5M20 31l5 5"/></svg>',
    robustaBean:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 5c11-3 24 6 26 18 2 10-5 19-16 20C16 44 6 35 5 25 4 16 8 8 17 5Z"/><path d="M15 8c8 8 12 16 11 23M8 13l-3-3M40 15l4-2M11 38l-4 3"/></svg>',
    southAmerica:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 5l11 3 4 7-4 5 4 6-3 8-4 5-2 7-5-7-1-7-5-5 3-7-4-4 2-6-4-5z"/></svg>',
    centralAmerica:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 11l8 2 3 5 7 1 4 5 7 1 3 5-6 1-5-4-6 2-4-5-7-1-4-5 2-7zM33 30l5 5-2 8-4-7z"/></svg>',
    africa:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 4l12 2 9 9-2 8-5 3-2 10-7 9-4-6-2-9-6-7 1-7-4-7 10-5z"/></svg>',
    asia:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 12l8-6 8 2 5-3 8 4 3 6 7 2-2 8-8 3-5 8-8-3-5-6-8-2-4-8 1-5z"/><path d="M35 34l4 4-3 5-4-3z"/></svg>',
    globe:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c6 6 8 12 8 18s-2 12-8 18M24 6c-6 6-8 12-8 18s2 12 8 18"/></svg>',
    decafCup:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h27v14a8 8 0 0 1-8 8h-11a8 8 0 0 1-8-8zM35 22h5a5 5 0 0 1 0 10h-5M6 44h35"/><path d="M17 15c-2-3 2-4 0-7M25 15c-2-3 2-4 0-7"/><path d="M10 9l28 30"/></svg>',
    caffeinatedCup:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h27v14a8 8 0 0 1-8 8h-11a8 8 0 0 1-8-8zM35 22h5a5 5 0 0 1 0 10h-5M6 44h35"/><path d="M15 14c-2-3 2-4 0-7M23 14c-2-3 2-4 0-7M31 14c-2-3 2-4 0-7"/></svg>',
    eitherCoffee:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 22h17v11a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6zM21 24h3a4 4 0 0 1 0 7h-3M3 41h22M27 17h17v13a6 6 0 0 1-6 6h-5a6 6 0 0 1-6-6zM44 19h2a4 4 0 0 1 0 7h-2M27 39h18"/></svg>',
    flavorChocolate:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM12 4v16M4 12h16"/></svg>',
    flavorNut:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6 7 4 11 5 15a7 7 0 0 0 14 0c1-4-1-8-7-13Z"/><path d="M12 5c-2 5-2 9 0 14"/></svg>',
    flavorSweet:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/><path d="M9 16c1 2 3 3 5 2"/></svg>',
    flavorFruit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7c-5-5-10-1-9 6 1 6 4 9 9 9s8-3 9-9c1-7-4-11-9-6Z"/><path d="M12 7c0-3 2-5 5-5M14 5c2-2 4-2 6-1"/></svg>',
    flavorFlower:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9c-4-7-9-3-5 1-7-1-7 6 0 5-4 5 2 9 5 2 3 7 9 3 5-2 7 1 7-6 0-5 4-4-1-8-5-1Z"/><circle cx="12" cy="13" r="2"/></svg>',
    flavorSpice:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 18 6M9 21 21 9M4 15l5 5M14 5l5 5"/><path d="M17 4l3-2M3 20l-1 2"/></svg>',
    flavorRoast:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c2 4 1 5-1 8 5-1 7 2 7 6a6 6 0 0 1-12 0c0-4 2-6 4-8-1 5 2 5 2 5 2-3 2-6 0-11Z"/></svg>',
    flavorEarth:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19c3-5 5-6 9-6s6 2 9 6M12 13V4M12 8c-3-4-6-3-6-3 0 4 2 6 6 6M12 10c3-4 6-3 6-3 0 4-2 6-6 6"/></svg>',
  };
  // Product metadata is curated from direct listings. pricePerKg is a non-live ranking estimate, not a guaranteed or displayed Amazon price.
  var PRODUCTS=[
    {asin:'B000FWHWGS',name:'Lavazza Crema e Aroma',pack:'1 kg',form:'beans',origin:'Blend aus Südamerika, Afrika & Südasien',region:'multi',regions:['southAmerica','africa','asia'],roast:3,strength:4,arabica:null,robusta:null,flavors:['Schokoladig'],pricePerKg:27,decaf:false,methods:['espresso','automatic','moka'],desc:'Vollmundiger Arabica-Robusta-Blend mit mittlerer Röstung, Intensität 8/10 und aromatischen Schokoladennoten.'},
    {asin:'B006G0EV6C',name:'Schwiizer Schüümli Crema',pack:'1 kg',form:'beans',origin:'Blend · 100 % Arabica',region:'blend',roast:3,strength:3,arabica:100,robusta:0,flavors:['Nussig','Karamell & süß','Schokoladig'],pricePerKg:22,decaf:false,methods:['automatic','filter','french','cold'],desc:'Ausgewogener Arabica für eine milde, runde Tasse; Stärke 3/5 laut Produktangabe.'},
    {asin:'B0C78PZB66',name:'Caffè Borbone Espresso Intenso',pack:'1 kg',form:'beans',origin:'Espresso-Blend',region:'blend',roast:5,strength:5,arabica:null,robusta:null,flavors:['Schokoladig','Röstig & bitter','Würzig'],pricePerKg:20,decaf:false,methods:['espresso','automatic','moka'],desc:'Dunkel und intensiv mit dunkler Schokolade; die Produktangabe nennt Intensität 9/10.'},
    {asin:'B000FIU38Q',name:'Coffee Bean Bella Café Crema Lacrema',pack:'1 kg',form:'beans',origin:'Blend · Herkunft nicht eindeutig ausgewiesen',region:'blend',roast:3,strength:3,arabica:null,robusta:null,flavors:['Nussig','Fruchtig','Karamell & süß'],pricePerKg:18,decaf:false,methods:['automatic','filter','french','cold'],desc:'Mittlere Röstung mit nussigem und leicht fruchtigem Profil; als Café-Crema-Bohne gelistet.'},
    {asin:'B00FGK5FPY',name:'Pellini N.82 Vivace',pack:'1 kg',form:'beans',origin:'Arabica-Robusta-Blend',region:'blend',roast:3,strength:4,arabica:null,robusta:null,flavors:['Schokoladig','Nussig','Würzig'],pricePerKg:19,decaf:false,methods:['espresso','automatic','moka'],desc:'Mittlere Röstung und ausgewogener Blend; gute Allround-Option für Espresso und Milchgetränke.'},
    {asin:'B07HBM5B41',name:'Melitta Barista Caffè Crema',pack:'1 kg',form:'beans',origin:'Blend · Herkunft nicht eindeutig ausgewiesen',region:'blend',roast:3,strength:3,arabica:null,robusta:null,flavors:['Nussig','Karamell & süß','Schokoladig'],pricePerKg:17.99,decaf:false,methods:['automatic','filter','french','cold'],desc:'Mittelkräftige Café-Crema-Bohne mit Stärke 3/5 laut Produktangabe.'},
    {asin:'B07CTT12F7',name:'by Amazon Espresso Crema',pack:'1 kg (2 × 500 g)',form:'beans',origin:'Blend · Herkunft nicht eindeutig ausgewiesen',region:'blend',roast:4,strength:4,arabica:null,robusta:null,flavors:['Schokoladig','Nussig','Röstig & bitter'],pricePerKg:15,decaf:false,methods:['espresso','automatic','moka'],desc:'Espresso-Crema-Mischung in zwei versiegelten 500-g-Beuteln; Intensität 4/5 laut Listing.'},
    {asin:'B0D6RTTM4K',name:'illy Classico',pack:'500 g',form:'beans',origin:'100 % Arabica · Blend',region:'blend',roast:2,strength:2,arabica:100,robusta:0,flavors:['Blumig','Fruchtig','Karamell & süß'],pricePerKg:27,decaf:false,methods:['espresso','automatic','filter','french','cold'],desc:'Feiner Arabica mit floralen und fruchtigen Noten; größte recherchierte illy-Classico-Packung in der Auswahl.'},
    {asin:'B079W7D4ZW',name:'Jacobs Barista Espresso',pack:'1 kg',form:'beans',origin:'Espresso-Blend · Herkunft nicht eindeutig ausgewiesen',region:'blend',roast:5,strength:5,arabica:null,robusta:null,flavors:['Schokoladig','Karamell & süß','Röstig & bitter'],pricePerKg:20,decaf:false,methods:['espresso','automatic','moka'],desc:'Dunkle Röstung mit Kakao- und Karamellnoten; Intensität 8/10 laut Produktangabe.'},
    {asin:'B000FIVV2S',name:'Melitta BellaCrema Espresso',pack:'1 kg',form:'beans',origin:'Espresso-Blend',region:'blend',roast:5,strength:5,arabica:null,robusta:null,flavors:['Schokoladig','Röstig & bitter','Würzig'],pricePerKg:18,decaf:false,methods:['espresso','automatic','moka'],desc:'Kräftige Espresso-Röstung mit Intensität 5/5 laut Herstellerangabe.'},
    {asin:'B0BFWKL9P4',name:'Melitta BellaCrema Decaf',pack:'1 kg',form:'beans',origin:'Entkoffeiniert · Blend',region:'blend',roast:3,strength:3,arabica:null,robusta:null,flavors:['Nussig','Schokoladig','Karamell & süß'],pricePerKg:24,decaf:true,methods:['automatic','filter','french','cold'],desc:'Entkoffeinierte Bohne mit mittlerer Stärke (3/5) – für den Kaffeegenuss ohne Koffein.'},
    {asin:'B0F1NGPRSL',name:'by Amazon Decaf',pack:'1 kg',form:'beans',origin:'100 % Arabica · entkoffeiniert',region:'blend',roast:2,strength:2,arabica:100,robusta:0,flavors:['Nussig','Karamell & süß','Blumig'],pricePerKg:13,decaf:true,methods:['automatic','filter','french','cold'],desc:'Milde entkoffeinierte 100-%-Arabica-Mischung; Intensität 2 laut Produktangabe.'},
    {asin:'B000VJ8NEU',name:'Lavazza Espresso Italiano Cremoso',pack:'1 kg',form:'beans',origin:'Arabica-Robusta-Blend',region:'blend',roast:4,strength:4,arabica:null,robusta:null,flavors:['Schokoladig','Würzig','Nussig'],pricePerKg:20,decaf:false,methods:['espresso','automatic','moka'],desc:'Kräftiger, mittlerer Röstgrad mit Kakao- und Gewürznoten; Intensität 8/10 laut Produktangabe.'},
    {asin:'B092DB8RFH',name:'Lavazza Crema e Gusto Classico',pack:'1 kg',form:'beans',origin:'Espresso-Blend · Herkunft nicht eindeutig ausgewiesen',region:'blend',roast:4,strength:4,arabica:null,robusta:null,flavors:['Schokoladig','Nussig','Röstig & bitter'],pricePerKg:21,decaf:false,methods:['espresso','automatic','moka'],desc:'Dunkle Schokolade und Nuss, mit mittelhoher Intensität (7/10) laut Produktangabe.'},
    {asin:'B0BXLTTJGK',name:'Darkest Power 100 % Robusta',pack:'1 kg',form:'beans',origin:'100 % Robusta · Herkunft nicht eindeutig ausgewiesen',region:'blend',roast:5,strength:5,arabica:0,robusta:100,flavors:['Schokoladig','Röstig & bitter','Erdig'],pricePerKg:25,decaf:false,methods:['espresso','automatic','moka'],desc:'Sehr kräftige, säurearme Robusta mit schokoladiger Richtung; 100 % Robusta laut Listing.'},
    {asin:'B07HJRYSTF',name:'Lucifers Roast 100 % Robusta',pack:'1 kg',form:'beans',origin:'100 % Robusta · Herkunft nicht eindeutig ausgewiesen',region:'blend',roast:5,strength:5,arabica:0,robusta:100,flavors:['Röstig & bitter','Erdig','Schokoladig'],pricePerKg:24,decaf:false,methods:['espresso','automatic','moka'],desc:'Dunkle, sehr starke Robusta-Röstung für Fans eines intensiven, körperreichen Espressos.'},
    {asin:'B0BHSRPJMJ',name:'by Amazon Colombian',pack:'1 kg (2 × 500 g)',form:'beans',origin:'Kolumbien · Rainforest-zertifiziert laut Listing',region:'southAmerica',roast:3,strength:3,arabica:null,robusta:null,flavors:['Fruchtig','Nussig','Karamell & süß'],pricePerKg:14,decaf:false,methods:['automatic','filter','french','cold'],desc:'Kolumbianischer Kaffee in zwei Frischebeuteln; mittlere Röstung laut Produktangabe.'},
    {asin:'B08J3DZ3FF',name:'Incapto Specialty Single Origin Brasilien',pack:'1 kg',form:'beans',origin:'Brasilien · 100 % Arabica · 84 SCA',region:'southAmerica',roast:3,strength:3,arabica:100,robusta:0,flavors:['Nussig','Schokoladig','Karamell & süß'],pricePerKg:32,decaf:false,methods:['espresso','automatic','filter','french','cold'],desc:'Sortenreiner brasilianischer Arabica; vielseitig vom Espresso bis zum Handfilter.'},
    {asin:'B08B5J89CJ',name:'Café Royal Crema Intenso Honduras',pack:'500 g',form:'beans',origin:'Honduras · Single Origin Mittelamerika',region:'centralAmerica',roast:4,strength:4,arabica:null,robusta:null,flavors:['Schokoladig','Nussig','Fruchtig'],pricePerKg:26,decaf:false,methods:['espresso','automatic','moka','filter'],desc:'Single-Origin-Crema aus Honduras; 500-g-Packung, Mittelamerika als Anbauregion.'},
    {asin:'B0049U0DMC',name:'Lavazza Qualità Oro',pack:'1 kg',form:'beans',origin:'100 % Arabica · Blend',region:'blend',roast:2,strength:2,arabica:100,robusta:0,flavors:['Blumig','Fruchtig','Karamell & süß'],pricePerKg:29,decaf:false,methods:['automatic','filter','french','cold'],desc:'100 % Arabica mit hellerem, aromatischem Profil; passend, wenn du feine statt sehr kräftige Noten bevorzugst.'},
    {asin:'B096W188L6',name:'TRE FORZE! Espresso',pack:'1 kg',form:'beans',origin:'Espresso-Blend · Holzfeuer-Röstung',region:'blend',roast:5,strength:4,arabica:null,robusta:null,flavors:['Schokoladig','Würzig','Röstig & bitter'],pricePerKg:47,decaf:false,methods:['espresso','automatic','moka'],desc:'Premium-Espresso mit traditioneller Holzfeuer-Röstung; besonders stimmig bei dunklen, würzigen Vorlieben.'},
    {asin:'B0DL1TP8RQ',name:'Mount Hagen Organic Arabica',pack:'4,5 kg (18 × 250 g)',packKg:4.5,form:'beans',origin:'Fairtrade-Blend: Papua-Neuguinea, Peru & Honduras',region:'multi',regions:['southAmerica','centralAmerica','asia'],roast:3,strength:3,arabica:100,robusta:0,flavors:['Fruchtig','Nussig'],pricePerKg:25.25,decaf:false,methods:['espresso','automatic','moka','filter','french','cold'],desc:'Fairtrade-Arabica mit fruchtig-nussigem Profil; die größte gelistete Packungsoption umfasst 18 Einzelbeutel à 250 g.'},
    {asin:'B005WRW1JO',name:'Dallmayr prodomo Decaffeinated',pack:'500 g',form:'beans',origin:'100 % Arabica · entkoffeiniert',region:'blend',roast:3,strength:3,arabica:100,robusta:0,flavors:['Nussig','Karamell & süß'],pricePerKg:20,decaf:true,methods:['filter','french','automatic'],desc:'Entkoffeinierter 100-%-Arabica in mittlerer Röstung; laut Produktseite für Handfilter, Filtermaschine und French Press geeignet.'},
    {asin:'B09BVYRF46',name:'Mount Hagen Organic Fairtrade Decaf',pack:'250 g',form:'beans',origin:'100 % Arabica · Bio, Fairtrade & entkoffeiniert',region:'blend',roast:3,strength:3,arabica:100,robusta:0,flavors:['Nussig','Karamell & süß','Blumig'],pricePerKg:39,decaf:true,methods:['filter','french','automatic','cold'],desc:'Entkoffeinierter Bio-Arabica mit Fairtrade- und Naturland-Angabe; mittlere Röstung.'},
    {asin:'B077X9SG2Y',name:'Dallmayr Prodomo, gemahlen',pack:'6 kg (12 × 500 g)',form:'ground',origin:'100 % Arabica · gemahlen für Filterkaffee',region:'blend',roast:3,strength:3,arabica:100,robusta:0,flavors:['Nussig','Karamell & süß','Fruchtig'],pricePerKg:17,decaf:false,methods:['filter'],desc:'Vakuumverpackter gemahlener 100-%-Arabica. Das verifizierte Amazon-Angebot enthält 12 × 500 g.'}
  ];
  var QUESTIONS=[
    {key:'method',title:'Wie bereitest du deinen Kaffee zu?',type:'cards'},
    {key:'flavor',title:'Dreh das Aromarad zu deinem Lieblingsgeschmack',type:'wheel'},
    {key:'roast',title:'Wie dunkel magst du deine Röstung?',type:'roast'},
    {key:'strength',title:'Wie kräftig darf die Tasse sein?',type:'strength'},
    {key:'form',title:'Mahlst du selbst – oder soll es schon gemahlen sein?',type:'cards'},
    {key:'milk',title:'Trinkst du deinen Kaffee mit Milch?',type:'cards'},
    {key:'species',title:'Die Grundsatzfrage: Arabica oder Robusta',type:'species'},
    {key:'region',title:'Welche Anbauregion macht dich neugierig?',type:'cards'},
    {key:'budget',title:'Was ist dein grober Preisrahmen pro Kilo?',type:'cards'},
    {key:'decaf',title:'Soll es koffeinfrei sein?',type:'cards'}
  ];
  var state={answers:{method:[],form:null,roast:3,strength:3,flavor:0,milk:null,species:null,region:null,budget:null,decaf:null},step:0,rotation:0,drag:null};
  var content=document.getElementById('question-content'), title=document.getElementById('step-title'), overline=document.getElementById('step-overline'), current=document.getElementById('progress-current'), fill=document.getElementById('progress-fill'), track=document.querySelector('.progress-track'), back=document.getElementById('back-btn'), next=document.getElementById('next-btn'), hint=document.getElementById('control-hint'), controls=document.getElementById('finder-controls');
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function choiceCard(key,val,icon,label,desc){
    var answer=state.answers[key],selected=Array.isArray(answer)?answer.indexOf(val)>=0:answer===val;
    var neutral=['both','any','either','other','unsure'].indexOf(val)>=0;
    var graphic=ICON_SVGS[icon]||'<span class="icon-glyph">'+icon+'</span>';
    return '<button type="button" class="choice-card'+(selected?' selected':'')+(neutral?' neutral-choice':'')+'" data-key="'+key+'" data-value="'+val+'" aria-pressed="'+selected+'"><span class="choice-icon" aria-hidden="true">'+graphic+'</span><span class="choice-copy"><b>'+label+'</b>'+(desc?'<small>'+desc+'</small>':'')+'</span><span class="selection-mark" aria-hidden="true">✓</span></button>';
  }
  function cardsFor(key){
    var a=state.answers;
    if(key==='method')return '<div class="choice-grid method-grid" role="group" aria-label="Zubereitungsarten">'+Object.keys(METHODS).map(function(k){var m=METHODS[k];return choiceCard(key,k,m.icon,m.name,m.desc);}).join('')+'</div><p class="helper-copy">Wähle alle Zubereitungsarten, die du nutzt.</p>';
    if(key==='form')return '<div class="choice-grid form-choice-grid" role="group" aria-label="Mahlgrad">'+choiceCard(key,'beans','coffeeBean','Ganze Bohne','Selbst mahlen für maximale Kontrolle und Aroma.')+choiceCard(key,'ground','groundCoffee','Schon gemahlen','Die bequeme Lösung')+'</div><p class="helper-copy">Für Siebträger und Herdkanne ist die richtige, feine Mahlung besonders wichtig. Vorgemahlener Kaffee passt daher nicht automatisch für jede Maschine.</p>';
    if(key==='milk')return '<div class="choice-grid compact-choice-grid" role="group" aria-label="Milch im Kaffee">'+choiceCard(key,'black','blackCoffee','Schwarz','Espresso oder Kaffee ohne Milch')+choiceCard(key,'milk','milkCoffee','Mit Milch','Cappuccino, Flat White oder Café au lait')+choiceCard(key,'both','bothCups','Mal so, mal so','')+'</div>';
    if(key==='region')return '<div class="choice-grid region-choice-grid" role="group" aria-label="Anbauregion">'+choiceCard(key,'southAmerica','southAmerica','Südamerika','z. B. Brasilien oder Kolumbien')+choiceCard(key,'centralAmerica','centralAmerica','Mittelamerika','z. B. Honduras')+choiceCard(key,'africa','africa','Afrika','z. B. Äthiopien oder Kenia')+choiceCard(key,'asia','asia','Asien','z. B. Indien oder Indonesien')+choiceCard(key,'any','globe','Keine Präferenz','Hauptsache, es schmeckt.')+'</div>';
    if(key==='budget')return '<div class="choice-grid compact-choice-grid budget-choice-grid" role="group" aria-label="Preisrahmen pro Kilogramm">'+choiceCard(key,'low','€','Unter 20 €/kg','Preisbewusste Bohnen für jeden Tag')+choiceCard(key,'mid','€€','20–30 €/kg','Mittlerer Preisbereich')+choiceCard(key,'high','€€€','Über 30 €/kg','Höherer Preisbereich und Specialty-Auswahl')+choiceCard(key,'any','globe','Offen','Geschmack geht vor Preis.')+'</div>';
    if(key==='decaf')return '<div class="choice-grid compact-choice-grid decaf-choice-grid" role="group" aria-label="Entkoffeinierter Kaffee">'+choiceCard(key,'yes','decafCup','Ja, entkoffeiniert','')+choiceCard(key,'no','caffeinatedCup','Nein, mit Koffein','')+choiceCard(key,'either','eitherCoffee','Beides passt','Geschmack ist wichtiger.')+'</div>';
    return '';
  }
  function beanSvg(){return '<svg class="coffee-bean-svg" viewBox="0 0 140 140" aria-hidden="true"><path class="coffee-bean-shape" d="M49 8C77 1 111 22 126 53c17 35 4 69-23 82-30 14-66-3-85-32C-2 74 11 26 49 8Z"/><path class="coffee-bean-seam" d="M46 13c13 14 24 32 28 51 5 24-4 47-19 66"/></svg>';}
  function strengthBeans(value){return '<div class="bean-rating" id="bean-rating" role="img" aria-label="'+value+' von 5 Bohnen">'+[1,2,3,4,5].map(function(n){return '<span class="strength-bean'+(n<=value?' active':'')+'">'+beanSvg()+'</span>';}).join('')+'</div><div class="strength-bean-caption" id="strength-bean-caption">'+value+' von 5 Bohnen</div>';}
  function rangeContent(key){
    var val=state.answers[key],isRoast=key==='roast';
    var left=isRoast?'Hell':'Sanft',right=isRoast?'Dunkel':'Kräftig';
    var line=isRoast?['','Helle, fruchtbetonte Röstung','Eher hell und aromatisch','Mittlere Röstung','Dunkel und kräftig','Sehr dunkel, röstig'][val]:['','Mild und leicht','Sanft, ausgewogen','Mittlere Stärke','Kräftig und voll','Sehr intensiv'][val];
    var shade=['','#bd8b5a','#a8774c','#835331','#623b27','#452719'][val];
    var visual=isRoast?'<div class="range-visual roast-visual" id="range-visual" style="--bean-tone:'+shade+'">'+beanSvg()+'</div>':'<div class="range-visual strength-visual">'+strengthBeans(val)+'</div>';
    var helper=isRoast?'<p class="helper-copy">Das ist dein Wunschprofil, keine technische Klassifizierung: Röstungen unterscheiden sich je nach Rösterei.</p>':'';
    return '<div class="range-panel"><div class="range-main"><label class="range-prompt" for="'+key+'-range"><span class="range-direction"><span>'+left+'</span><span class="double-arrow" aria-hidden="true">↔</span><span>'+right+'</span></span></label><div class="range-selection">Deine Auswahl: <strong id="range-caption">'+line+'</strong></div><input id="'+key+'-range" type="range" min="1" max="5" step="1" value="'+val+'" aria-valuetext="'+line+'"></div>'+visual+'</div>'+helper;
  }
  function wheelSvg(){
    var svg='<div class="wheel-wrap"><span class="wheel-pointer" aria-hidden="true">▼</span><svg class="taste-wheel" id="taste-wheel" viewBox="0 0 300 300" role="img" tabindex="0" aria-label="Drehbares Kaffeearomarad. Mit Maus, Finger oder Pfeiltasten steuerbar."><circle cx="150" cy="150" r="145" fill="#fffaf4" stroke="#e8ddcf" stroke-width="2"/><g id="wheel-wedges" transform="rotate('+state.rotation+' 150 150)">';
    FLAVORS.forEach(function(f,i){var start=(i*45-22.5-90)*Math.PI/180,end=((i+1)*45-22.5-90)*Math.PI/180;var x1=150+132*Math.cos(start),y1=150+132*Math.sin(start),x2=150+132*Math.cos(end),y2=150+132*Math.sin(end);svg+='<path d="M150 150 L'+x1.toFixed(2)+' '+y1.toFixed(2)+' A132 132 0 0 1 '+x2.toFixed(2)+' '+y2.toFixed(2)+' Z" fill="'+f.color+'" stroke="#fffaf4" stroke-width="2"/>';});
    svg+='</g><g id="wheel-labels" transform="rotate('+state.rotation+' 150 150)">';
    FLAVORS.forEach(function(f,i){var angle=(i*45-90)*Math.PI/180,tx=150+87*Math.cos(angle),ty=150+87*Math.sin(angle);svg+='<text id="taste-label-'+i+'" x="'+tx.toFixed(1)+'" y="'+ty.toFixed(1)+'" transform="rotate('+(-state.rotation)+' '+tx.toFixed(1)+' '+ty.toFixed(1)+')" text-anchor="middle" dominant-baseline="middle" fill="#fffaf4" font-size="10" font-family="Arial,sans-serif" font-weight="700" textLength="48" lengthAdjust="spacingAndGlyphs">'+escapeHtml(f.short)+'</text>';});
    svg+='</g><circle cx="150" cy="150" r="34" fill="#fffaf4" stroke="#e8ddcf" stroke-width="2"/><circle cx="150" cy="150" r="6" fill="#99613b"/></svg></div>';
    return svg;
  }
  function wheelContent(){
    var f=FLAVORS[state.answers.flavor];
    return '<div class="taste-layout"><div class="taste-column">'+wheelSvg()+'<p class="taste-hint">Zieh das Rad mit dem Finger oder der Maus. Der Geschmack an der Markierung oben wird ausgewählt.</p></div><div class="taste-explainer"><span class="micro">DEIN GESCHMACKS-KOMPASS</span><div id="flavor-selection-readout" class="flavor-selection-readout" aria-live="polite" aria-label="Aktuelle Aromaauswahl: '+escapeHtml(f.name)+'"><span class="flavor-selection-label">Deine Auswahl:</span><span class="flavor-selection-value"><span class="flavor-icon" aria-hidden="true">'+(ICON_SVGS[f.icon]||'')+'</span><strong id="flavor-name">'+escapeHtml(f.name)+'</strong></span></div><h3 id="flavor-title">Was dich erwartet</h3><p id="flavor-copy">'+escapeHtml(f.copy)+'</p></div></div>';
  }
  function speciesContent(){
    return '<div class="species-intro"><p><strong>Arabica</strong> ist häufig vielschichtig und duftig, oft mit feinerer Säure und im Allgemeinen weniger Koffein als Robusta. <strong>Robusta</strong> schmeckt meist kräftiger, enthält mehr Koffein und sorgt für eine dichte Crema; sie wird häufig als Anteil in Espresso-Blends verwendet.</p></div><div class="choice-grid choices-inline" role="group" aria-label="Bohnensorte">'+choiceCard('species','arabica','arabicaBean','Eher Arabica','aromatisch und oft nuanciert')+choiceCard('species','blend','blendBeans','Gern als Blend','Arabica und Robusta gemischt')+choiceCard('species','robusta','robustaBean','Kräftig mit Robusta','mehr Körper und Crema')+choiceCard('species','any','globe','Keine Präferenz','ich probiere gern')+'</div>';
  }
  function render(){var q=QUESTIONS[state.step];if(state.step>=QUESTIONS.length){renderResults();return;}hint.hidden=false;title.textContent=q.title;overline.textContent='DEIN PROFIL · FRAGE '+(state.step+1)+' VON '+QUESTIONS.length;current.textContent=String(state.step+1).padStart(2,'0');fill.style.width=((state.step+1)/QUESTIONS.length*100)+'%';track.setAttribute('aria-valuenow',String(state.step+1));if(back)back.disabled=state.step===0;var answer=state.answers[q.key];var valid=q.key==='method'?Array.isArray(answer)&&answer.length>0:answer!==null&&answer!==undefined;next.disabled=!valid;hint.textContent=valid?'Deine Auswahl ist gespeichert':'Wähle eine Antwort, um weiterzugehen';if(q.type==='cards')content.innerHTML=cardsFor(q.key);else if(q.type==='roast'||q.type==='strength')content.innerHTML=rangeContent(q.key);else if(q.type==='wheel')content.innerHTML=wheelContent();else if(q.type==='species')content.innerHTML=speciesContent();content.setAttribute('aria-label','Frage '+(state.step+1)+' von '+QUESTIONS.length);}
  function setFlavor(){var idx=((Math.round(-state.rotation/45)%8)+8)%8;state.answers.flavor=idx;var angle=state.rotation,wedges=document.getElementById('wheel-wedges'),labels=document.getElementById('wheel-labels');if(wedges)wedges.setAttribute('transform','rotate('+angle+' 150 150)');if(labels)labels.setAttribute('transform','rotate('+angle+' 150 150)');FLAVORS.forEach(function(_,i){var label=document.getElementById('taste-label-'+i);if(label){var rad=(i*45-90)*Math.PI/180,x=150+87*Math.cos(rad),y=150+87*Math.sin(rad);label.setAttribute('transform','rotate('+(-angle)+' '+x.toFixed(1)+' '+y.toFixed(1)+')');}});var f=FLAVORS[idx],name=document.getElementById('flavor-name'),copy=document.getElementById('flavor-copy'),readout=document.getElementById('flavor-selection-readout'),icon=readout&&readout.querySelector('.flavor-icon');if(name)name.textContent=f.name;if(copy)copy.textContent=f.copy;if(readout){readout.setAttribute('aria-label','Aktuelle Aromaauswahl: '+f.name);if(icon)icon.innerHTML=ICON_SVGS[f.icon]||'';}}
  function updateRange(input){
    var key=input.id.indexOf('roast')===0?'roast':'strength',val=Number(input.value);
    state.answers[key]=val;
    var label=key==='roast'?['','Helle, fruchtbetonte Röstung','Eher hell und aromatisch','Mittlere Röstung','Dunkel und kräftig','Sehr dunkel, röstig'][val]:['','Mild und leicht','Sanft, ausgewogen','Mittlere Stärke','Kräftig und voll','Sehr intensiv'][val];
    var caption=document.getElementById('range-caption');if(caption)caption.textContent=label;
    input.setAttribute('aria-valuetext',label);
    if(key==='roast'){
      var shade=['','#bd8b5a','#a8774c','#835331','#623b27','#452719'][val],visual=document.getElementById('range-visual');
      if(visual&&visual.style)visual.style.setProperty('--bean-tone',shade);
    }else{
      var rating=document.getElementById('bean-rating'),caption=document.getElementById('strength-bean-caption');
      if(rating){rating.setAttribute('aria-label',val+' von 5 Bohnen');rating.querySelectorAll('.strength-bean').forEach(function(bean,i){bean.classList.toggle('active',i<val);});}
      if(caption)caption.textContent=val+' von 5 Bohnen';
    }
    next.disabled=false;hint.textContent='Deine Auswahl ist gespeichert';
  }
  function isWithinPriceBand(pricePerKg,budget){
    if(budget==='low')return pricePerKg<20;
    if(budget==='mid')return pricePerKg>=20&&pricePerKg<=30;
    if(budget==='high')return pricePerKg>30;
    return true;
  }
  function matchProduct(p,a){
    if(a.decaf==='yes'&&!p.decaf)return null;
    var points=0,total=0,reasons=[];
    function add(weight,fit){total+=weight;points+=weight*Math.max(0,Math.min(1,fit));}
    var selectedMethods=Array.isArray(a.method)?a.method:[a.method];
    var supportedMethods=selectedMethods.filter(function(k){return p.methods.indexOf(k)>=0;});
    var methodFit=selectedMethods.length?supportedMethods.length/selectedMethods.length:0;
    var methodMatch=methodFit>0;
    add(18,methodFit);
    if(methodMatch)reasons.push('passt zu '+supportedMethods.map(function(k){return METHODS[k].name.toLowerCase();}).join(' & '));
    var formMatch=p.form===a.form;
    add(14,formMatch?1:0);
    if(!formMatch)reasons.push(p.form==='beans'?'für deinen Favoriten frisch mahlen':'andere Mahlform als gewählt');
    var roastDelta=Math.abs(p.roast-a.roast),strengthDelta=Math.abs(p.strength-a.strength);
    add(12,1-roastDelta/4);
    add(12,1-strengthDelta/4);
    var flavor=FLAVORS[a.flavor].name,flavorMatch=p.flavors.indexOf(flavor)>=0;
    add(18,flavorMatch?1:0);
    if(flavorMatch)reasons.push('trifft '+flavor.toLowerCase()+'-Noten');
    var milkFit=a.milk==='both'?0.65:(a.milk==='milk'?(p.strength>=4?1:0.45):(p.arabica===100?1:0.55));
    add(4,milkFit);
    if(a.milk==='milk'&&p.strength>=4)reasons.push('kräftig genug für Milch');
    if(a.species!=='any'){
      var speciesFit=0.25;
      if(a.species==='arabica')speciesFit=p.arabica!==null?(p.arabica>=80?1:(p.robusta>=50?0:0.55)):0.35;
      if(a.species==='robusta')speciesFit=p.robusta!==null?(p.robusta>=50?1:(p.arabica===100?0:0.55)):0.35;
      if(a.species==='blend')speciesFit=(p.arabica!==null&&p.robusta!==null&&p.arabica>0&&p.robusta>0)?1:((p.arabica===100||p.robusta===100)?0.15:0.5);
      add(8,speciesFit);
      if(speciesFit>=0.9)reasons.push(a.species==='arabica'?'Arabica-dominant':(a.species==='robusta'?'kräftiger Robusta-Anteil':'Arabica-Robusta-Blend'));
    }
    if(a.region!=='any'){
      var regionFit=(p.region===a.region||(p.regions&&p.regions.indexOf(a.region)>=0))?1:(p.region==='blend'?0.28:0.08);
      add(8,regionFit);
      if(regionFit===1)reasons.push('Herkunft '+({southAmerica:'Südamerika',centralAmerica:'Mittelamerika',asia:'Asien',africa:'Afrika'}[a.region]||'deiner Auswahl'));
    }
    var budgetMatch=a.budget==='any'||isWithinPriceBand(p.pricePerKg,a.budget);
    if(a.budget!=='any')add(18,budgetMatch?1:0);
    if(a.decaf!=='either'){
      var decafMatch=(a.decaf==='yes')===p.decaf;
      add(12,decafMatch?1:0);
      if(decafMatch&&p.decaf)reasons.push('entkoffeiniert');
    }
    var raw=total?points/total:0;
    return {product:p,score:Math.min(94,48+Math.round(raw*46)),rankScore:raw,methodMatch:methodMatch,formMatch:formMatch,flavorMatch:flavorMatch,budgetMatch:budgetMatch,reasons:reasons.slice(0,2)};
  }
  function getRecommendations(){
    var a=state.answers;
    var ranked=PRODUCTS.map(function(p){return matchProduct(p,a);}).filter(Boolean);
    ranked.sort(function(x,y){
      return Number(y.budgetMatch)-Number(x.budgetMatch) || y.rankScore-x.rankScore || Number(y.methodMatch)-Number(x.methodMatch) || Number(y.formMatch)-Number(x.formMatch) || Number(y.flavorMatch)-Number(x.flavorMatch) || x.product.name.localeCompare(y.product.name);
    });
    // The curated list includes decaf options; if it ever changes, keep a real tagged decaf product visible instead of a blank result state.
    if(!ranked.length){ranked=PRODUCTS.filter(function(p){return p.decaf;}).map(function(p){return matchProduct(p,Object.assign({},a,{decaf:'either'}));}).filter(Boolean).sort(function(x,y){return y.rankScore-x.rankScore;});}
    return ranked.slice(0,3);
  }
    function tagList(a){var f=FLAVORS[a.flavor].name,methods=(Array.isArray(a.method)?a.method:[a.method]).map(function(k){return METHODS[k].name;}).join(' & '),labels=[methods,a.form==='beans'?'Ganze Bohne':'Gemahlen',f];if(a.decaf==='yes')labels.push('Entkoffeiniert');return labels;}
  function medalMarkup(place){
    var award=[
      {metal:'gold',name:'Gold',roman:'I',color:'#c58a1d',light:'#fff0a7',dark:'#77500d'},
      {metal:'silver',name:'Silber',roman:'II',color:'#92979c',light:'#f5f7f7',dark:'#50565b'},
      {metal:'bronze',name:'Bronze',roman:'III',color:'#a96031',light:'#f2c09a',dark:'#60341d'}
    ][place];
    var id='bean-metal-'+(place+1);
    return '<div class="medal-stage medal-stage--'+award.metal+'" role="img" aria-label="'+award.name+'farbene Bohnenmedaille, Platz '+(place+1)+'"><svg class="bean-medal-svg" viewBox="0 0 120 132" aria-hidden="true"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+award.light+'"/><stop offset=".24" stop-color="'+award.color+'"/><stop offset=".48" stop-color="'+award.light+'"/><stop offset=".72" stop-color="'+award.color+'"/><stop offset="1" stop-color="'+award.dark+'"/></linearGradient><linearGradient id="'+id+'-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+award.light+'"/><stop offset="1" stop-color="'+award.dark+'"/></linearGradient></defs><path class="medal-bean-outline" d="M45 8C72 1 101 18 111 45c12 31-1 64-26 78-27 15-58 4-73-20C-5 78 9 23 45 8Z" fill="url(#'+id+')" stroke="url(#'+id+'-edge)" stroke-width="4"/><path class="medal-bean-shine" d="M42 14c-17 12-25 33-23 51" fill="none" stroke="#fff" stroke-opacity=".72" stroke-width="4" stroke-linecap="round"/><path class="medal-bean-seam" d="M39 14c14 15 27 31 31 49 5 22-5 43-22 59" fill="none" stroke="'+award.dark+'" stroke-opacity=".68" stroke-width="7" stroke-linecap="round"/><path d="M43 19c11 14 20 28 23 43 4 19-3 37-16 51" fill="none" stroke="'+award.light+'" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/><text x="69" y="74" text-anchor="middle" class="medal-rank-numeral" fill="'+award.dark+'">'+award.roman+'</text><circle cx="91" cy="31" r="3" fill="'+award.light+'" opacity=".9"/></svg><div class="medal-caption"><span>Platz '+(place+1)+'</span><b>'+award.name+'</b></div></div>';
  }
  function renderResults(){
    overline.textContent='DEIN BOHNEN-PROFIL · FERTIG';
    title.textContent='Das könnte deine Tasse sein.';
    current.textContent='✓';fill.style.width='100%';track.setAttribute('aria-valuenow','10');if(back)back.disabled=false;next.style.display='none';hint.textContent='';hint.hidden=true;
    var recs=getRecommendations(),a=state.answers;
    var html='<div class="results-head"><div><span class="step-overline">DEIN PROFIL STEHT</span><h3>Dein klarer Sieger – plus passende Alternativen.</h3><p>Die Empfehlungen richten sich nach deinen Zubereitungsarten und Vorlieben. Die Profil-Passung ist eine Orientierung, kein objektiver Geschmackstest.</p></div><div class="profile-tags">'+tagList(a).map(function(t){return '<span class="profile-tag">'+escapeHtml(t)+'</span>';}).join('')+'</div></div>';
    html+='<div class="result-grid">'+recs.map(function(r,i){
      var p=r.product,primary=i===0,origin=escapeHtml(p.origin);
      var href='https://www.amazon.de/dp/'+encodeURIComponent(p.asin)+'?tag='+encodeURIComponent(AMAZON_TAG);
      var rank=primary?'Dein klarer Sieger':'Alternative '+(i+1);
      var score=primary?'<span class="match-score">'+r.score+'% Profil-Passung</span>':'';
      var priceTag=a.budget==='any'?'':'<span class="price-fit-chip '+(r.budgetMatch?'inside':'outside')+'">'+(r.budgetMatch?'passt zur Preiswahl':'außerhalb der Preiswahl')+'</span>';
      return '<article class="result-card"><div class="result-rank"><span class="rank-label">'+rank+'</span>'+score+'</div>'+medalMarkup(i)+'<h3>'+escapeHtml(p.name)+'</h3><div class="result-origin">'+origin+'</div><p class="result-desc">'+escapeHtml(p.desc)+'</p><div class="product-chips"><span>'+escapeHtml(p.pack)+'</span><span>'+escapeHtml(p.form==='beans'?'Ganze Bohne':'Gemahlen')+'</span><span>'+escapeHtml(p.decaf?'Entkoffeiniert':'Koffeinhaltig')+'</span>'+priceTag+'</div><a class="btn small amazon amazon-cta" href="'+href+'" target="_blank" rel="sponsored nofollow noopener" data-google-ads-conversion="amazon-bean-finder-clickout">Bei Amazon kaufen</a></article>';
    }).join('')+'</div>';
    if(a.budget!=='any'){
      var inRange=recs.filter(function(r){return r.budgetMatch;}).length;
      if(inRange<3)html+='<div class="budget-note">'+(inRange>0?'Der Sieger liegt in deiner gewählten €/kg-Preisspanne.':'Für diese Kombination gibt es keinen passenden Treffer in der gewählten €/kg-Preisspanne.')+' Weitere Alternativen außerhalb der Preisspanne sind markiert.</div>';
    }
    if(a.form==='ground'&&recs[0].product.form==='beans')html+='<div class="region-caveat"><strong>Zur Mahlform:</strong> Der beste direkt verifizierte Treffer für deine Zubereitung ist als ganze Bohne gelistet. Für die gewählte Zubereitung brauchst du eine geeignete Mühle. <a class="mill-guide-link" href="/muehlen">Mühlen ansehen</a></div>';
    if(recs[0].product.packKg>=3||recs[0].product.pack.indexOf('6 kg')>=0)html+='<div class="bulk-warning"><strong>Hinweis zur großen Packung:</strong> Das Angebot enthält mehrere Einzelbeutel. Für Aroma und Frische nur einen Beutel nach dem anderen öffnen.</div>';
    if(a.region!=='any'&&!PRODUCTS.some(function(p){return p.region===a.region||(p.regions&&p.regions.indexOf(a.region)>=0);}))html+='<div class="region-caveat"><strong>Zur Herkunft:</strong> In der aktuell geprüften Auswahl gibt es keinen eindeutig bestätigten Amazon-Treffer aus dieser Region. Die Empfehlungen zeigen deshalb die nächsten geschmacklichen Treffer, ohne ihnen eine unbestätigte Herkunft zuzuschreiben.</div>';
    html+='<div class="result-actions"><button type="button" class="finder-restart" id="restart-btn"><span aria-hidden="true">↻</span> Von vorn starten</button></div>';
    content.innerHTML=html;
  }
    content.addEventListener('click',function(e){
    var card=e.target.closest('.choice-card');
    if(card){
      var key=card.dataset.key,val=card.dataset.value;
      if(key==='method'){
        var selected=Array.isArray(state.answers.method)?state.answers.method.slice():[];
        var index=selected.indexOf(val);if(index>=0)selected.splice(index,1);else selected.push(val);
        state.answers.method=selected;
        content.querySelectorAll('.choice-card[data-key="method"]').forEach(function(el){var chosen=selected.indexOf(el.dataset.value)>=0;el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));});
        next.disabled=selected.length===0;
        hint.textContent=selected.length?('Ausgewählt: '+selected.map(function(k){return METHODS[k].name;}).join(', ')):'Wähle mindestens eine Zubereitungsart';
      }else{
        state.answers[key]=val;
        content.querySelectorAll('.choice-card[data-key="'+key+'"]').forEach(function(el){var chosen=el.dataset.value===val;el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));});
        next.disabled=false;hint.textContent='Deine Auswahl ist gespeichert';
      }
      return;
    }
    if(e.target.closest('#restart-btn')){state={answers:{method:[],form:null,roast:3,strength:3,flavor:0,milk:null,species:null,region:null,budget:null,decaf:null},step:0,rotation:0,drag:null};next.style.display='';hint.hidden=false;render();window.scrollTo({top:document.querySelector('.finder-shell').offsetTop-16,behavior:'smooth'});}
  });
  content.addEventListener('input',function(e){if(e.target&&e.target.type==='range')updateRange(e.target);});
  content.addEventListener('keydown',function(e){if(e.target.id==='taste-wheel'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();state.rotation+=(e.key==='ArrowRight'?45:-45);setFlavor();}});
  content.addEventListener('pointerdown',function(e){if(!e.target.closest('#taste-wheel'))return;var wheel=document.getElementById('taste-wheel'),r=wheel.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;state.drag={id:e.pointerId,angle:Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI,rotation:state.rotation,moved:false};wheel.setPointerCapture(e.pointerId);});
  content.addEventListener('pointermove',function(e){if(!state.drag||state.drag.id!==e.pointerId)return;var wheel=document.getElementById('taste-wheel'),r=wheel.getBoundingClientRect(),angle=Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI;var delta=angle-state.drag.angle;if(delta>180)delta-=360;if(delta< -180)delta+=360;if(Math.abs(delta)>2)state.drag.moved=true;state.rotation=state.drag.rotation+delta;setFlavor();});
  content.addEventListener('pointerup',function(e){if(state.drag&&state.drag.id===e.pointerId){state.drag=null;}});content.addEventListener('pointercancel',function(){state.drag=null;});
  back.addEventListener('click',function(){if(state.step>0){state.step=Math.min(state.step-1,QUESTIONS.length-1);next.style.display='';hint.hidden=false;render();}});
  next.addEventListener('click',function(){if(next.disabled)return;if(state.step<QUESTIONS.length-1){state.step++;render();}else{state.step=QUESTIONS.length;render();}});
  render();
})();
