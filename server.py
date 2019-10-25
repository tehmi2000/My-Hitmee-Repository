from http.server import HTTPServer as hs, BaseHTTPRequestHandler

host = ''
PORT = 3200
main_dir = "Public/"
routes = {"": ""}

class my_server(BaseHTTPRequestHandler):
		
	def do_GET(self):
		print(self.path == "/")
		if self.path == "/":
			self.path = '/hitmee_login.html'
		try:
			#Reading the file
			print(f"Serving file: {main_dir + self.path[1:]}")
			file_to_open = open(main_dir + self.path[1:]).read()
			self.send_response(200)
		except:
			file_to_open = "File not Found"
			self.send_response(404)
			
		self.end_headers()
		self.wfile.write(bytes(file_to_open, 'utf-8'))


#Running the web server
httpd = hs((host, PORT), my_server)
print(f"Server started \nServing web server on Port {PORT}")
httpd.serve_forever()
	