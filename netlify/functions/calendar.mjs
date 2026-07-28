// Netlify Function: live .ics feed of all Wellgreens store visits.
// URL: /.netlify/functions/calendar  (subscribe to this in Google Calendar)
const SB_URL = "https://yswabuojaexpwdpoflrr.supabase.co";
const SB_KEY = "sb_publishable_lCdg75FSViIAyBbgmLZzag_tW-i0kQE";
const PEOPLE = [["carlos","Carlo"],["julio","Julio"],["oscar","Oscar"],["manny","Manny"],["marisol","Marisol"]];
const pad = n => String(n).padStart(2,"0");
function nextDay(iso){ const d=new Date(iso+"T00:00:00Z"); d.setUTCDate(d.getUTCDate()+1); return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}`; }

export default async function handler(){
  const stamp = new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Wellgreens//Store Visits//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Store Visits\r\n";
  try{
    const res = await fetch(`${SB_URL}/rest/v1/board?id=eq.1&select=data`, { headers:{ apikey:SB_KEY, Authorization:"Bearer "+SB_KEY } });
    const rows = await res.json();
    const cal = (rows && rows[0] && rows[0].data && rows[0].data.cal) || {};
    for(const [id,name] of PEOPLE){
      const p = cal[id] || {};
      for(const date of Object.keys(p)){
        const codes = Array.isArray(p[date]) ? p[date] : (p[date] ? [p[date]] : []);
        for(const code of codes){
          if(!code) continue;
          const d1 = date.replace(/-/g,"");
          ics += `BEGIN:VEVENT\r\nUID:${id}-${date}-${code}@wellgreens\r\nDTSTAMP:${stamp}\r\nDTSTART;VALUE=DATE:${d1}\r\nDTEND;VALUE=DATE:${nextDay(date)}\r\nSUMMARY:${name} -> ${code}\r\nDESCRIPTION:Wellgreens store visit\r\nEND:VEVENT\r\n`;
        }
      }
    }
  }catch(e){}
  ics += "END:VCALENDAR\r\n";
  return new Response(ics, { status:200, headers:{ "Content-Type":"text/calendar; charset=utf-8", "Cache-Control":"public, max-age=300" } });
}
