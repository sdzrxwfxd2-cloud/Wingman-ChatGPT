"""DEMO-only local server: serves ../.. statically and proxies /api/metar|taf to aviationweather.gov,
the same role the live site's same-origin /api functions play (browsers block cross-origin calls from localhost)."""
import http.server,urllib.request,urllib.parse,sys,os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..'))
class H(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*a):pass
  def do_GET(self):
    u=urllib.parse.urlparse(self.path)
    if u.path in('/api/metar','/api/taf'):
      ids=urllib.parse.parse_qs(u.query).get('ids',[''])[0]
      if not ids:
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'[]');return
      try:
        d=urllib.request.urlopen(f'https://aviationweather.gov/api/data/{u.path[5:]}?ids={urllib.parse.quote(ids)}&format=json',timeout=15).read()
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(d or b'[]')
      except Exception as e:self.send_error(502,str(e))
      return
    super().do_GET()
http.server.ThreadingHTTPServer(('',int(sys.argv[1]) if len(sys.argv)>1 else 8787),H).serve_forever()
