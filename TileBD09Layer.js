
window.TileBD09Layer = (function(){

	function clamp(value,min,max){
		return value < min ? min : value > max ? max: value
	}

	function transformMat4(out, a, m) {
		  var x = a[0],
		      y = a[1],
		      z = 0;
		  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
		  w = w || 1.0;
		  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
		  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
		  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
		  return out;
	}

	var caches = {
		data:{},
		get:function(key){
			return this.data[key];
		},
		put:function(key,value){
			this.data[key] = value;
		},
		clear:function(){
			this.data = {};
		}
	};

	var lib = mapboxgl;
	
	var transparentPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

	var transparentImage = (function(){
		var canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;
		var context = canvas.getContext("2d");
		context.fillStyle = "rgba(0,0,0,0)";  
		context.fillRect(0,0,256,256); 
		return canvas;
	})();

	var vetexShaderSource = `
		#ifdef GL_FRAGMENT_PRECISION_HIGH
			precision highp float;
		#else
			precision mediump float;
		#endif
		uniform mat4 u_Matrix;
		uniform vec4 u_Translate;
		attribute vec3 a_Position;
		attribute vec2 a_UV;
		varying vec2 v_UV;
		void main(){
			v_UV = a_UV;
			gl_Position = vec4( (a_Position.xy + u_Translate.xy), 0.0 ,1.0 );
		}
	`;

	var fragmentShaderSource = `
		#ifdef GL_FRAGMENT_PRECISION_HIGH
			precision highp float;
		#else
			precision mediump float;
		#endif
		varying vec2 v_UV;
		uniform sampler2D texture;
		void main(){
			vec4 textureColor = texture2D(texture,v_UV);
			gl_FragColor = textureColor;
		}
	`;

	function TileBD09Layer(options){

		this._options = Object.assign({
			minzoom:3,
			maxzoom:22,
			tileSize:256
		},options);

		this._extent = this._options.extent || [-180,-90,180,90];

		this._map = null;
		this._transform = null;
		this._program = null;
		this._gl = null;

		//当前可视区域的切片
		this._tiles = {};

	}

	TileBD09Layer.prototype = {

		constructor:TileBD09Layer,

		addTo:function(map){

			this._map = map;
			this._transform = map.transform;
			this._layerId = "vectorTileLayer_"+Date.now();

			map.addLayer({
				id:this._layerId,
				type: 'custom',
				onAdd: (function(_this){
					return function(map,gl){
						return _this._onAdd(map,gl,this);
					}
				})(this),
				render: (function(_this){
					return function(gl, matrix){
						return _this._render(gl, matrix, this);
					}
				})(this)
			});

			map.on("remove",function(){
				caches.clear();
			});
		},

		_onAdd: function(map,gl){
			var _this = this;

			this._gl = gl;

			this.transparentTexture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.transparentTexture);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transparentImage);
			gl.bindTexture(gl.TEXTURE_2D,null);

			var vetexShader = gl.createShader(gl.VERTEX_SHADER)
			gl.shaderSource(vetexShader,vetexShaderSource);
			gl.compileShader(vetexShader);

			if (!gl.getShaderParameter(vetexShader,gl.COMPILE_STATUS)) {
				throw "Shader Compile Error: " + (gl.getShaderInfoLog(vetexShader));
			}

			var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragmentShader,fragmentShaderSource);
			gl.compileShader(fragmentShader);

			if (!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)) {
				throw "Shader Compile Error: " + (gl.getShaderInfoLog(fragmentShader));
			}

			var program = this._program = gl.createProgram();
			gl.attachShader(program, vetexShader);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);
			/**
			 * 属性
			 */
			var attributes = this._attributes = {
				aPosition:{
					name:"a_Position",
					location:gl.getAttribLocation(this._program,"a_Position"),
				},
				aUV:{
					name:"a_UV",
					location:gl.getAttribLocation(this._program,"a_UV"),
				}
			};

			/**
			 * 缓冲区
			 */
			this._buffers = {
				aPositionBuffer:{
					buffer:gl.createBuffer(),
					size:3,
					attribute: attributes["aPosition"],
					points: new Float32Array(3 * 6),
					update:function(extent){
					},
					update1:function(ext){

						gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
						var points = this.points;

						points[0] =  ext[6] , points[1] = ext[7], points[2] = 1.0 , 
						points[3] =  ext[2] , points[4] = ext[3], points[5] = 1.0,  
						points[6] =  ext[0] , points[7] = ext[1], points[8] = 1.0  ,
						points[9] =  ext[2] , points[10] = ext[3], points[11] = 1.0 , 
						points[12] = ext[0], points[13] = ext[1], points[14] = 1.0,  
						points[15] = ext[4], points[16] = ext[5], points[17] = 1.0 ;

						gl.bufferData(gl.ARRAY_BUFFER,points, gl.STATIC_DRAW);
						gl.enableVertexAttribArray(this.attribute.location);
						gl.vertexAttribPointer(this.attribute.location,this.size,gl.FLOAT,false,0,0);

					}
				},
				aUVBuffer:{
					buffer:gl.createBuffer(),
					size:2,
					attribute:attributes["aUV"],
					points:new Float32Array( [0,0,1,0,0,1,1,0,0,1,1,1] ),
					hasBufferData:false,
					update:function(){
						gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
						if(!this.hasBufferData){
							gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.STATIC_DRAW);
							this.hasBufferData = true;
						}
						gl.enableVertexAttribArray(this.attribute.location);
						gl.vertexAttribPointer(this.attribute.location,this.size,gl.FLOAT,false,0,0);
					}
				}
			}
			/**
			 * 变量
			 */
			this._uniforms = {
				uMatrix:{
					value:null,
					location:gl.getUniformLocation(this._program,"u_Matrix"),
					update:function(matrix){
						if(this.value !== matrix){
							gl.uniformMatrix4fv(this.location,false,matrix);
						}
					}
				},
				uTranslate:{
					value:[0,0],
					location:gl.getUniformLocation(this._program,"u_Translate"),
					update:function(){}
				},
				uTexture:{
					value:null,
					location:gl.getUniformLocation(this._program, 'texture'),
					update:function(){}
				}
			};
		},
		/**
		 * 渲染
		 * @param {*} gl 
		 * @param {*} matrix 
		 */
		_render:function(gl, matrix){
			if(this._program){
				
				var transform = this._transform;
				var options = this._options;
				var tileSize = options.tileSize ||256;

				//matrix = transform.mercatorMatrix1;

				var z  =  transform.coveringZoomLevel({
					tileSize:tileSize,
					roundZoom:true
				});
				
				this.realz = z;

				z = z < 3 ? 3 : z;

				this.z = z;

				if (options.minzoom !== undefined && z < options.minzoom) { z = 0; }

				if (options.maxzoom !== undefined && z > options.maxzoom) { z = options.maxzoom; }
	
				var resolution =  this.resolution = this.getResolutionFromZ(z);

				var center = transform.center;

				//var centerCoord = lib.MercatorCoordinate.fromLngLat(transform.center);
				var maxx = clamp (center.lng + resolution * tileSize, -180, 180);
				var miny = clamp (center.lat - resolution * tileSize, -90, 90);
				var minx = clamp (center.lng, -180, 180) ,maxy = clamp(center.lat, -90,90) ;
				var leftBottom = lib.MercatorCoordinate.fromLngLat([minx,miny]);
				var topRight = lib.MercatorCoordinate.fromLngLat([maxx,maxy]);

				this.centerMecatorExtent = [leftBottom.x,leftBottom.y,topRight.x,topRight.y];

				gl.useProgram(this._program);

				gl.enable(gl.BLEND);

				gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);


				for(let key in this._uniforms){
					this._uniforms[key].update(matrix);
				}

				for(let key in this._buffers){
					this._buffers[key].update();
				}

				this.calcTilesInView();

				this.renderTiles();
				
			}
		},
		renderTiles(){
			var gl = this._gl;
			var tiles = this._tiles;
			var tile,extent;

			for(var key in tiles){

				tile = tiles[key];

				tile.calcExtent();

			}

			for (var key in tiles){
				tile = tiles[key];
				extent = tile.extent;

				if( (Math.abs(extent[2] - extent[0]) > 2) 
					//|| (Math.abs(extent[3] - extent[1]) > 2)   
					|| (Math.abs(extent[6] - extent[4]) > 2)  
					//|| (Math.abs(extent[7] - extent[5]) > 2) 
					){
					continue;
				}

				this._buffers.aPositionBuffer.update1(tile.extent);

				gl.uniform4fv(this._uniforms.uTranslate.location,tile.translate);
				gl.activeTexture(gl.TEXTURE0);
				if(tile.texture){
					gl.bindTexture(gl.TEXTURE_2D, tile.texture);
				}else{
					gl.bindTexture(gl.TEXTURE_2D, this.transparentTexture);
				}
				gl.uniform1i(this._uniforms.uTexture.location, 0);
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
		},
		/**
		 * 计算当前可视范围内的切片
		 */
		calcTilesInView:function(){
			var z = this.z;
			var options = this._options;
			var tileSize = options.tileSize ||256;

			var resolution = this.resolution;
	
			var extent = this._extent;
			var tileRes = resolution * tileSize;
			var viewExtent = this.getViewExtent();


			var sw = this.getBaiduRCLByWgs84LngLat(z,[viewExtent[0],viewExtent[1]]);
			var ne = this.getBaiduRCLByWgs84LngLat(z,[viewExtent[2],viewExtent[3]]);

			var startX = sw[0],endX = ne[0];
			var startY = sw[1],endY = ne[1]; 
			
			//console.log(this.realz);
			
			// startX = startX < 20 ? 20 : startX;
			//startY = startY < 1 ?  1 : startY;
			// endX = endX < 31 ? 31 : endX;
			//endY = endY < 20 ? 20 : endY;
			// if(this.realz < 5){
			// 	endY = endY > 10 ? 10 : endY
			// }
			

			var i,j,key,tile;

			var tiles = this._tiles;

			var newTiles = {}

			for(i = startX ; i <=  endX; i ++){
				for(j = startY; j <= endY ; j ++){
					key = this._key(z,i,j);
					if(!tiles[key]){
						caches.get(key);
						if(caches.get(key)){
							newTiles[key] = caches.get(key);
						}else{
							tile = new Tile(z,i,j,resolution,this);
							newTiles[key] = tile;
						}
					}else{
						newTiles[key] = tiles[key];
						delete tiles[key];
					}
				}
			};
			
			for(var key in tiles){
				if(tiles[key].request){
					tiles[key].request.cancel();
				}
			}

			this._tiles = newTiles;
			
		},

		/**
	     * 通过一个界别和wgs84的经纬度得到在百度里面的行列号和lebel
	     * @param {any} level
	     * @param {any} wgs84p
	     */
	    getBaiduRCLByWgs84LngLat:function(z, point) {
	        //先将转成百度
	        var guojiaP = coordtransform.wgs84togcj02(point[0], point[1]);//转换成国标
	        var baiduP = coordtransform.gcj02tobd09(guojiaP[0], guojiaP[1]);//国标转百度 得到的 baiduP[0] 表示lng ， baiduP[1] 表示lat 
	        
	        baiduP[0] = clamp(baiduP[0],-180,180);
	        baiduP[1] = clamp(baiduP[1],-90,90);

	        // 百度经纬度在转百度米坐标     
	        var baiduXY = BDTool.zb([baiduP[0],baiduP[1]]);

	        var t = Math.pow(2, 18 - z);//最顶层的一张照片是当前层级的多少张照片
	        var k = Math.pow(2, 18 - z) * this._options.tileSize;//计算每一个图片表示墨卡托坐标系的大小
	        var col = Math.floor(baiduXY[0] / k);//地图切片的行号
	        var row = Math.floor(baiduXY[1] / k);//地图切片的列号 纬度
	        return [col,row];
	    },
		_key:function(z,x,y){
			return z+'/'+x+"/"+y;
		},
		/**
		 * 计算分辨率
		 */
		getResolutionFromZ:function(z){
			return 1.4062500000000002 / Math.pow(2,z);
		},
		/**
		 * 计算extent
		 */
		getViewExtent:function(){
			var transform = this._transform;
			var bounds = [
				transform.pointLocation(new lib.Point(0, 0)),
				transform.pointLocation(new lib.Point(transform.width, 0)),
				transform.pointLocation(new lib.Point(transform.width, transform.height)),
				transform.pointLocation(new lib.Point(0, transform.height))				
			];

			var minx , miny , maxx, maxy;

			for(var i = 0,point = null ; i < bounds.length ; i ++ ){
				point = bounds[i];
				if(i ==  0 ){
					minx = point.lng;
					miny = point.lat;
					maxx = point.lng;
					maxy = point.lat;
				}else {
					if(minx > point.lng) minx = point.lng;
					if(miny > point.lat) miny = point.lat;
					if(maxx < point.lng) maxx = point.lng;
					if(maxy < point.lat) maxy = point.lat;
				}
			}

			return [
				clamp(minx,-180,180),
				clamp(miny,-90,90),
				clamp(maxx,-180,180),
				clamp(maxy,-90,90)
			]
		},
		/**
		 * 重绘
		 */
		repaint:function(){
			this._map.triggerRepaint();
		}

	}

		/**
	 * 请求
	 * @param {*} url 
	 * @param {*} callback 
	 * @param {*} async 
	 */
	var getImage = (function(){

		var MAX_REQUEST_NUM = 16;

		var requestNum = 0;
		var requestQuenes = [];

		function getImage(url,callback){
			if(requestNum > MAX_REQUEST_NUM){
				var quene = {	
					url:url,
					callback:callback,
					canceled:false,
					cancel:function(){
						this.canceled = true;
					}
				}
				requestQuenes.push(quene);
				return quene;
			}

			var advanced = false;
			var advanceImageRequestQueue = function () {
				if (advanced) { return; }
				advanced = true;
				requestNum--;
				while (requestQuenes.length && requestNum < MAX_REQUEST_NUM) { // eslint-disable-line
					var request = requestQuenes.shift();
					var url = request.url;
					var callback = request.callback;
					var canceled = request.canceled;
					if (!canceled) {
						request.cancel = getImage(url, callback).cancel;
					}
				}
			};

			requestNum ++ ;	
			var req = get(url,function(error,data){
				advanceImageRequestQueue();
				if(!error){
					var URL = window.URL || window.webkitURL;
					var blob = new Blob([data],{type:"image/png"});
					var blobUrl = URL.createObjectURL(blob)
					var image = new Image();
					image.src = blobUrl;
					image.onload = function(){
						callback(image);
						URL.revokeObjectURL(image.src);
					};
					image.src = data.byteLength ? URL.createObjectURL(blob) : transparentPngUrl;
				}

			});

			return {
				cancel:function(){
					req.abort();
				}
			}
		}

		function get(url, callback, async) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, async === false ? false : true);
			xhr.responseType = "arraybuffer";
			xhr.onabort = function (event) {
				callback(true, null);
			};
			xhr.onload = function (event) {
				if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
					var source;
					source = xhr.response;
					if (source) {
						try {
							source = eval("(" + source + ")");
						} catch (e) {
						}
					}
					if (source) {
						callback(false, source);
					} else {
						callback(false, null);
					}
				}
			};
			xhr.onerror = function (e) {
				callback(true, null);
			};
			xhr.send(null);
			return xhr;
		}

		return getImage;
	})()



	function Tile(z,x,y,resolution,layer){
		this._resolution = resolution;
		this.z = z;
		this._layer = layer;
		this._coord = [z,x,y];
		this._gl = layer._gl;
		this._url = layer._options.url;
		this.texture = null;
		this.loaded = false;
		this.tileSize = layer._options.tileSize;
		this.worldExtent = layer._extent;
		this.extent = [0,0,0,0,0,0,0,0];
		this.translate = [0,0,0,0];
		this._store = [0,0];
		this._load();
	}

	Tile.prototype = {
		constructor:Tile,
		calcExtent:function(){

			var transform = this._layer._transform;
			
			var x = this._coord[1],y = this._coord[2];
			var wgs84Bound = this.getWgs84BoundByBaiduRCL(y,x, this.z);
            var swWebgl = mapboxgl.MercatorCoordinate.fromLngLat(wgs84Bound.slice(0,2));
            var neWebgl = mapboxgl.MercatorCoordinate.fromLngLat(wgs84Bound.slice(2,4));
            var seWebgl = mapboxgl.MercatorCoordinate.fromLngLat(wgs84Bound.slice(4,6)); //new mapboxgl.Point(neWebgl.x,swWebgl.y) //
            var nwWebgl = mapboxgl.MercatorCoordinate.fromLngLat(wgs84Bound.slice(6,8)); //new mapboxgl.Point(swWebgl.x,neWebgl.y) //

            var arr = this._store;
            arr[0] = swWebgl.x,arr[1] = swWebgl.y;
            transformMat4(arr,arr,transform.mercatorMatrix);
			this.extent[0] = arr[0];
			this.extent[1] = arr[1];
			arr[0] = neWebgl.x,arr[1] = neWebgl.y;
			transformMat4(arr,arr,transform.mercatorMatrix);
			this.extent[2] = arr[0];
			this.extent[3] = arr[1];
			arr[0] = seWebgl.x,arr[1] = seWebgl.y;
			transformMat4(arr,arr,transform.mercatorMatrix);
			this.extent[4] = arr[0];
			this.extent[5] = arr[1];
			arr[0] = nwWebgl.x,arr[1] = nwWebgl.y;
			transformMat4(arr,arr,transform.mercatorMatrix);
			this.extent[6] = arr[0];
			this.extent[7] = arr[1];
		},

		getWgs84BoundByBaiduRCL:function(R, C, L) {
	        //有纠偏
	        var tileM = Math.pow(2, 18 - L) * this.tileSize;
	        var minX = C * tileM;
	        var minY = R * tileM;
	        var maxX = minX + tileM;
	        var maxY = minY + tileM;
	        var baiduWgsSW = BDTool.Ab([minX,maxY]);
	        var baiduWgsNE = BDTool.Ab([maxX,minY]);
	        var baiduWgsSE = BDTool.Ab([maxX, maxY]);
        	var baiduWgsNW = BDTool.Ab([minX, minY]);

	        //console.log(minX + ":" + minY + ":" + baiduWgsSW.lng + ":" + baiduWgsSW.lat + ":" + maxX + ":" + maxY + ":" + baiduWgsNE.lng + ":" + baiduWgsNE.lat);
	        var guojiaSW = coordtransform.bd09togcj02(baiduWgsSW[0], baiduWgsSW[1]);
	        var guojiaNE = coordtransform.bd09togcj02(baiduWgsNE[0], baiduWgsNE[1]);
	        var guojiaSE = coordtransform.bd09togcj02(baiduWgsSE[0], baiduWgsSE[1]);
        	var guojiaNW = coordtransform.bd09togcj02(baiduWgsNW[0], baiduWgsNW[1]);

	        var wgs84SW = coordtransform.gcj02towgs84(guojiaSW[0], guojiaSW[1]);
	        var wgs84NE = coordtransform.gcj02towgs84(guojiaNE[0], guojiaNE[1]);
	        var wgs84SE = coordtransform.gcj02towgs84(guojiaSE[0], guojiaSE[1]);
	        var wgs84NW = coordtransform.gcj02towgs84(guojiaNW[0], guojiaNW[1]);

	        return wgs84SW.concat(wgs84NE).concat(wgs84SE).concat(wgs84NW);

	    },

		_load: function(){
			var gl = this._gl
			var _this = this;
			var z = this._coord[0];
			var x = this._coord[1];
			var y = this._coord[2];

			

			var url = this._url.replace("{x}",x).replace("{y}",y).replace("{z}",z);

			this.request = getImage(url,function(img){
				delete _this .request;
				if(_this._gl){
					var texture = _this.texture = gl.createTexture();
					gl.bindTexture(gl.TEXTURE_2D, texture);
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
					gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
					gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
					gl.bindTexture(gl.TEXTURE_2D, null);
					caches.put(z+"/"+x+"/"+y,_this);
					_this.loaded = true;
					_this._layer.repaint();
				}
			});
		}
	}


	return TileBD09Layer

})()
