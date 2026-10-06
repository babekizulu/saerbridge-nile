"use strict";
const townships=[
 {slug:'greenbushes',name:'Greenbushes',municipality:'Nelson Mandela Bay',province:'Eastern Cape',latitude:-33.92,longitude:25.45,description:'Pilot township research area. Approximate area marker; settlement classification and boundaries await local verification.'},
 {slug:'walmer-township',name:'Walmer township',municipality:'Nelson Mandela Bay',province:'Eastern Cape',latitude:-33.99,longitude:25.58,description:'Township research pilot in Nelson Mandela Bay. Approximate area marker, never a participant location.'}
];
const themes=[
 ['employment','Reliable employment','Need'],['transport','Affordable transport','Need'],['services','Housing and basic services','Need'],
 ['safety','Safer public spaces','Want'],['enterprise','Local enterprise','Aspiration'],['community','Community support','Asset']
].map(([slug,name,category])=>({slug,name,category,description:`Interview accounts of ${name.toLowerCase()}.`}));
const emptyArchive=()=>({areas:[],themes,findings:[],quotes:[],releases:[]});
module.exports={townships,themes,emptyArchive};
