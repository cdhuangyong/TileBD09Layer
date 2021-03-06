window.BDTool = (function(){

	function Xa(a) {
	    return "function" === typeof a
	}
	function Wa(a) {
	    return "number" === typeof a
	}
	function Za(a) {
	    return "string" == typeof a
	}
	function Db(a) {
	    return "undefined" != typeof a
	}
	function Eb(a) {
	    return "object" == typeof a
	}
	
	var p = null;
	var j = undefined;


	var BDTool = {
		lP:6370996.81,
		tG:[1.289059486E7, 8362377.87, 5591021, 3481989.83, 1678043.12, 0],
		Eu:[75, 60, 45, 30, 15, 0],
		rP:[
            [1.410526172116255E-8, 8.98305509648872E-6, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 1.73379812E7],
            [-7.435856389565537E-9, 8.983055097726239E-6, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 1.026014486E7],
            [-3.030883460898826E-8, 8.98305509983578E-6, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37],
            [-1.981981304930552E-8, 8.983055099779535E-6, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06],
            [3.09191371068437E-9, 8.983055096812155E-6, 6.995724062E-5, 23.10934304144901, -2.3663490511E-4, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4],
            [2.890871144776878E-9, 8.983055095805407E-6, -3.068298E-8, 7.47137025468032, -3.53937994E-6, -0.02145144861037, -1.234426596E-5, 1.0322952773E-4, -3.23890364E-6, 826088.5]
        ],
        qG:[
            [-0.0015702102444, 111320.7020616939, 1704480524535203, -10338987376042340, 26112667856603880, -35149669176653700, 26595700718403920, -10725012454188240, 1800819912950474, 82.5],
            [8.277824516172526E-4, 111320.7020463578, 6.477955746671607E8, -4.082003173641316E9, 1.077490566351142E10, -1.517187553151559E10, 1.205306533862167E10, -5.124939663577472E9, 9.133119359512032E8, 67.5],
            [0.00337398766765, 111320.7020202162, 4481351.045890365, -2.339375119931662E7, 7.968221547186455E7, -1.159649932797253E8, 9.723671115602145E7, -4.366194633752821E7, 8477230.501135234, 52.5],
            [0.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5],
            [-3.441963504368392E-4, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5],
            [-3.218135878613132E-4, 111320.7020701615, 0.00369383431289, 823725.6402795718, 0.46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, 0.37238884252424, 7.45]
        ],
        w2:function(a, b) {
	        if (!a || !b) return 0;
	        var c, d, a = this.Ab(a);
	        if (!a) return 0;
	        c = this.Tk(a[0]);
	        d = this.Tk(a[1]);
	        b = this.Ab(b);
	        return !b ? 0 : this.Re(c, this.Tk(b[0]), d, this.Tk(b[1]))
	    },
	    Zo:function(a, b) {
	        if (!a || !b) return 0;
	        a[0] = this.OD(a[0], -180, 180);
	        a[1] = this.SD(a[1], -74, 74);
	        b[0] = this.OD(b[0], -180, 180);
	        b[1] = this.SD(b[1], -74, 74);
	        return this.Re(this.Tk(a[0]), this.Tk(b[0]), this.Tk(a[1]), this.Tk(b[1]))
	    },
	    Ab:function(a) {
	        if (a === p || a === j) return [0,0];
	        var b, c;
	        b = [Math.abs(a[0]), Math.abs(a[1])];
	        for (var d = 0; d < this.tG.length; d++) if (b[1] >= this.tG[d]) {
	            c = this.rP[d];
	            break
	        }
	        a = this.qK(a, c);
	        return a = [+a[0].toFixed(6), +a[1].toFixed(6)]
	    },
	    zb:function(a) {
	        if (a === p || a === j || 180 < a[0] || -180 > a[0] || 90 < a[1] || -90 > a[1]) return [0,0];
	        var b, c;
	        a[0] = this.OD(a[0], -180, 180);
	        a[1] = this.SD(a[1], -74, 74);
	        b = [a[0],a[1]];
	        for (var d = 0; d < this.Eu.length; d++) if (b[1] >= this.Eu[d]) {
	            c = this.qG[d];
	            break
	        }
	        if (!c) for (d = 0; d < this.Eu.length; d++) if (b[1] <= -this.Eu[d]) {
	            c = this.qG[d];
	            break
	        }
	        a = this.qK(a, c);
	        return a = [a[0].toFixed(2), a[1].toFixed(2)]
	    },
	    //经纬度转百度墨卡托坐标系
	    qK:function(a, b) {//百度坐标偏移
	        if (a && b) {
	            var c = b[0] + b[1] * Math.abs(a[0]),
	                d = Math.abs(a[1]) / b[9],
	                d = b[2] + b[3] * d + b[4] * d * d + b[5] * d * d * d + b[6] * d * d * d * d + b[7] * d * d * d * d * d + b[8] * d * d * d * d * d * d,
	                c = c * (0 > a[0] ? -1 : 1),
	                d = d * (0 > a[1] ? -1 : 1);
	            return [c, d]
	        }
	    },
	    Re:function(a, b, c, d) {
	        return this.lP * Math.acos(Math.sin(c) * Math.sin(d) + Math.cos(c) * Math.cos(d) * Math.cos(b - a))
	    },
	    Tk:function(a) {
	        return Math.PI * a / 180
	    },
	    v4:function(a) {
	        return 180 * a / Math.PI
	    },
	    SD:function(a, b, c) {
	        b != p && (a = Math.max(a, b));
	        c != p && (a = Math.min(a, c));
	        return a
	    },
	    OD:function(a, b, c) {
	        for (; a > c;) a -= c - b;
	        for (; a < b;) a += c - b;
	        return a
	    }
	}
	return BDTool;
})()