var APP;
var WM;

/******* ONLOAD *******/
$(function() {
	WM = WebMidi;
	var prom = checkMidi();
	prom.then(initApp, errorMidi);
});


/*
/** CHECK MIDI 
/***/
function checkMidi() {
    return new Promise((resolve, reject) => {
    	WM.enable(function (err) {
			if (err) {
				console.log("WebMidi could not be enabled !");
				reject();
			} else {
				//console.log("WebMidi enabled !");
				//console.log(WM.inputs);
				//console.log(WM.outputs);
				resolve();
			}
		}, true);
	})	
}

/*
/** ERROR MIDI 
/***/
function errorMidi(){
	alert("MIDI NOT FOUND !\r\nPlease use Opera, Chrome or Android WebView component.\r\nYou can use Jazz-Plugin with Firefox, Safari and IE.");
	//window.location = "https://github.com/djipco/webmidi#browser-support";

	if( typeof thenErrorMidi === "function" ){
		thenErrorMidi();
	}

}

/*
/** ERROR MIDI
/***/
function thenErrorMidi(){
	$("body *").remove();
	$("body").html("<p>Error MIDI !<p><p><a href='https://nathanpaletat.com' >Back</a></p>");
}

/*
/** INIT APP
/***/
function initApp(){
	APP = new app();

	APP.init();
}


/***********************************************************************************************************/
/***********************************************************************************************************/
/***********************************************************************************************************/

function app(){
	this.dir = 'out',
	this.MidiOutput = '',  
	this.d = {},

	this.init = function(){
		init_device();
		init_channel();
		init_velo();
		init_duration();
		init_pitch();
		init_cc();
		init_keyboard();
		init_listenkey();
		init_modal();
		init_keymap();
		APP.update();
	},

	this.update = function(){
		//console.log("UP");
		APP.device.update();
		APP.channel.update();
	}
}

/***********************************************************************************************************/
/******* DEVICE ********************************************************************************************/
/***********************************************************************************************************/

function init_device(){
	APP.device = {
		init : function(){
			APP.device.refresh();
			APP.d.devSelect.change(function(){
				APP.update();
			});
			WM.addListener( 'connected', APP.device.konect );
			WM.addListener( 'disconnected', APP.device.dekonect );

			APP.d.devMaj.click(function(){
				$( this ).css("background-color", "#0075ff87");
				APP.device.refresh();
				setTimeout(function(){
					APP.d.devMaj.css("background-color", "#ccb722e0");
				}, 300);
			});

			APP.d.panic.click(function(){
				$( this ).css("background-color", "#0075ff87");
				APP.device.panic();
				setTimeout(function(){
					APP.d.panic.css("background-color", "#ccb722e0");
				}, 300);
			});
			

		},
		refresh : function(){
			var opt='';
			var xputs;
			switch(APP.dir){
				case 'in' : xputs = WM.inputs; break;
				case 'out' : xputs = WM.outputs; break;
			}
			xputs.forEach(function(obj) {
				opt+="<option value='"+obj.id+"' name='"+obj.name+"' data-manu='"+obj.manufacturer+"'>"+obj.name+" / "+obj.manufacturer+"</option>";
			});
			APP.d.devSelect.html(opt);
		},
		update : function(){
			this.id = APP.d.devSelect.val();
			this.name = APP.d.devSelect.find("option:selected").attr('name');
			this.manu = APP.d.devSelect.find("option:selected").attr('data-manu');
			var error=false;
			var ghost;
			switch(APP.dir){
				case 'in' : ghost = APP.MidiInput = WM.getInputById( this.id ); break;
				case 'out' : ghost = APP.MidiOutput = WM.getOutputById( this.id ); break;
			}
			if(ghost===false){
				APP.device.dispWarning("Error ! Please click 'Refresh' !");
			}
		},
		panic : function(){
			APP.MidiOutput.sendChannelMode('allnotesoff');
			APP.MidiOutput.sendChannelMode('allsoundoff');
		},
		konect : function(e){
			console.log('New device connected.');
			APP.device.refresh();
		},
		dekonect : function(e){
			if( e.port.id == APP.device.id ){
				APP.device.dispWarning("Your device is disconnected !");
			} else {
				APP.device.refresh();
			}
		},
		dispWarning : function(t){
			APP.d.devWarn.html(t);
			setTimeout(function(){
				APP.device.update();
				APP.d.devWarn.animate({
					opacity: 0,
				}, 2000, function(){ APP.d.devWarn.html("").css('opacity', 1);  });
			}, 1000);
		}
	}

	APP.d.devMaj = $("button#majdev");
	APP.d.panic = $("button#panic");
	APP.d.devSelect = $("select#mididevice");
	APP.d.devState = $("div#dispState span");
	APP.d.devWarn = $("div#devWarning");
	
	APP.device.init();

}

/***********************************************************************************************************/
/******* CHANNEL *******************************************************************************************/
/***********************************************************************************************************/

function init_channel(){
	APP.channel = {
		a : [1],
		mod : 'solo',
		last : 1,
		
		init : function(){
			
			//CLICK ON MODE
			$("div#p_channel div#mode button").click(function(){
				APP.channel.select_mod(this);
			});

			//CLICK ON CHANNEL
			APP.d.chanBut.click(function(){
				APP.channel.last=$(this).attr('data-chan');
				switch(APP.channel.mod){
					case 'solo':
						APP.d.chanBut.attr('data-activ', '');
					case 'multi':
						if($(this).attr('data-activ')=='on'){
							if($("div#espChan button[data-activ='on']").length>1){
								$(this).attr('data-activ', '');
							}
						} else {
							$(this).attr('data-activ', 'on');
						}
					break;
					case 'all':
						APP.d.chanBut.attr('data-activ', 'on');
					break;
				}
				APP.update();
			});
		},

		update : function(){
			if(APP.channel.mod=='all'){
				APP.channel.a = 'all';
			} else {
				APP.channel.a = [];
				$("div#espChan button[data-activ='on']").each(function(){
					APP.channel.a[APP.channel.a.length] = $(this).attr('data-chan');
				});
			}
		},

		select_mod : function(that){
			$(that).parent().find('button').attr('data-activ', '');
			$(that).attr('data-activ', 'on');
			APP.channel.mod = $(that).attr('id');
			switch(APP.channel.mod){
				case 'solo':
					APP.d.chanBut.attr('data-activ', '');
					$("div#espChan button[data-chan='"+APP.channel.last+"']").attr('data-activ', 'on');
				break;
				case 'multi':
				break;
				case 'all':
					APP.d.chanBut.attr('data-activ', 'on');
				break;
			}
			APP.update();
		}
	}
	APP.d.chanBut = $("div#espChan button[data-chan]");
	APP.channel.init();
}



/***********************************************************************************************************/
/******* VELOCITY ******************************************************************************************/
/***********************************************************************************************************/
function init_velo(){
	APP.velo = {
		val : 100,
		init : function(){
			$("input#valVel").on("input", function(){
				$("div#p_velocity div.dispVal").html(this.value);
				APP.velo.val = this.value;
			});
		}
	}
	APP.velo.init();
}

/***********************************************************************************************************/
/******* DURATION ******************************************************************************************/
/***********************************************************************************************************/
function init_duration(){
	APP.dur = {
		val : 1000,
		autoStop : false,
		max : 5000,
		init : function(){
			APP.d.durInput.on("input", function(){
				APP.d.durVal.html(this.value);
				APP.dur.val = this.value;
			});
			$("input#maxdur").change(function(){
				var max = $(this).val();
				APP.d.durInput.attr('max', max);
				if( max<APP.dur.val ){
					APP.d.durVal.html(max);
					APP.dur.val = max;
				}
			});
			$("input#modplay").change(function(){
				APP.dur.autoStop = $(this).is(":checked");
				if(APP.dur.autoStop){
					APP.d.durTR.removeClass('disab');
					APP.d.durInput.removeClass('disab');
				} else {
					APP.d.durTR.addClass('disab');
					APP.d.durInput.addClass('disab');
				}
			});
		}
	}
	APP.d.durInput = $("input#valDur");
	APP.d.durVal = $("div#p_dur .dispVal");
	APP.d.durTR = $("div#p_dur .top_right");
	APP.dur.init();
}

/***********************************************************************************************************/
/******* PITCH *********************************************************************************************/
/***********************************************************************************************************/
function init_pitch(){
	APP.pitch = {
		val : 0,
		bRtz : true,
		init : function(){
			APP.d.pitchInput.on("input", function(){
				APP.d.pitchVal.html(this.value);
				APP.pitch.val = Number(this.value);

				APP.pitch.sendpitch(Number(this.value));
			});
			APP.d.pitchInput.change(function(){
				if(APP.pitch.bRtz){
					APP.d.pitchInput.val(0);
					APP.d.pitchVal.html(0);
					APP.pitch.val = 0;
					APP.pitch.sendpitch(0);
				}
			});
			$("input#chk_pitch_rtz").click(function(){
				APP.pitch.bRtz = $(this).is(":checked");
				if(APP.pitch.bRtz){
					APP.d.pitchInput.change();
				}
			});
		},
		sendpitch : function(val){
			APP.MidiOutput.sendPitchBend(val/100, APP.channel.a);
		}
	}
	APP.d.pitchInput = $("input#valPitch");
	APP.d.pitchVal = $("div#p_pitch .dispVal");
	APP.pitch.init();
}

/***********************************************************************************************************/
/******* CC ************************************************************************************************/
/***********************************************************************************************************/
function init_cc(){
	APP.cc = {
		val : 0,
		num : 1,
		save : {},
		create : function(){
			var o='';
			for(var i=0; i<120; i+=4){
				o += "<div class='cc_col'><button value='"+i+"' type='button'>"+i+" <span>"+tabCC[i]+"</span></button></div>";
				var j=i+1;
				o += "<div class='cc_col'><button value='"+j+"' type='button'>"+j+" <span>"+tabCC[j]+"</span></button></div>";
				j++;
				o += "<div class='cc_col'><button value='"+j+"' type='button'>"+j+" <span>"+tabCC[j]+"</span></button></div>";
				j++;
				o += "<div class='cc_col'><button value='"+j+"' type='button'>"+j+" <span>"+tabCC[j]+"</span></button></div>";
			}
			$('#modal_choose_cc div.cc_line').html(o);

		},
		init : function(){
			this.create();

			APP.d.ccInput.on("input", function(){
				APP.d.ccVal.html(this.value);
				APP.cc.val = Number(this.value);
				APP.cc.sendcc();
				APP.cc.save[APP.cc.num]=APP.cc.val;
			});

			$("#modal_choose_cc button").click(function(){
				APP.cc.num = Number($(this).val());
				var t = $(this).html();
				if( !(APP.cc.num in APP.cc.save) ){
					APP.d.ccInput.val(0);
					APP.d.ccVal.html(0);
				} else {
					APP.d.ccInput.val(APP.cc.save[APP.cc.num]);
					APP.d.ccVal.html(APP.cc.save[APP.cc.num]);
				}
				$("h3#open_modal_allcc").html(t);
				$("div.modal").hide();
			});

		},
		sendcc : function(){
			APP.MidiOutput.sendControlChange(APP.cc.num, APP.cc.val, APP.channel.a);
		}
	}
	APP.d.ccInput = $("input#valCc");
	APP.d.ccVal = $("div#p_cc .dispVal");
	APP.cc.init();
}

/***********************************************************************************************************/
/******* KEYBOARD ******************************************************************************************/
/***********************************************************************************************************/
function init_keyboard(){
	APP.keyboard = {
		create : function(){

			var wTouch = 54;
			var bTouch = 44;
			var wKeyb = (wTouch*75)+75;
			var styleW = " width:"+wTouch+"px; ";
			var styleB = " width:"+bTouch+"px; ";
			var left = (wKeyb/2)-(wTouch*10);

			APP.d.keybMain.css("width", wKeyb+"px");
			APP.d.keybMain.css("left", "-"+left+"px");

			//white key
			var o='';
			var aNote = ['C','D','E','F','G','A','B'];
			for(var oct=-1; oct<10; oct++){
				for(var note=0; note<7; note++){
					if(!( oct==9 && note>4) ){
						o += "<div class='key' style='"+styleW+"' id='"+aNote[note]+oct+"'><span>"+aNote[note]+oct+"</span></div>";
					}
				}
			}
			APP.d.keybMain.find('#white').html(o);

			//black key
			var o='';
			var aNote = ['C#','D#','F#','G#','A#'];
			var l=0;
			for(var oct=-1; oct<10; oct++){
				for(note=0; note<5; note++){
					if(!( oct==9 && note>2) ){
						var style = styleB+" left:"+l+"px; ";
						o += "<div class='key' style='"+style+"' id='"+aNote[note]+oct+"'><span>"+aNote[note]+oct+"</span></div>";
						l += 9 + (bTouch+2);
						if( aNote[note]=='D#' || aNote[note]=='A#' ){
							l += 9 + (bTouch+2);
						}
					}
				}
			}
			APP.d.keybMain.find('#black').html(o);

			//octaves
			var o='';
			var l=10;
			for(var oct=-1; oct<10; oct++){
				var style = " left:"+l+"px; ";
				if( oct==9 && note>2 ){
					style += " width:250px; ";
				}
				o += "<div class='octiv' style='"+style+"' ><span title='Octave "+oct+"' id='"+oct+"' >"+oct+"</span></div>";
				l += wTouch*7 +7 ;
			}
			APP.d.keybMain.find('#octaves').html(o);

		},

		init : function(){
			this.create();
			APP.d.keybMain.draggable({
				axis: "x",
				distance: 5,
				handle: "#octaves",
				start: function( event, ui ) {
					APP.wScreen=window.innerWidth;
					APP.wKeyb = $( "#keyboard" ).width();
				},
				drag: function( event, ui ) {
					
					if(ui.position.left>10){
						ui.position.left=10;
					}
					var p = ui.position.left + Number( APP.wKeyb );
					if(p<APP.wScreen){
						ui.position.left=APP.wScreen-APP.wKeyb-10;
					}
					
				}
			});
			APP.d.keybMain.css('left', (APP.wScreen-APP.wKeyb)/2) ;
			
			$("div.key").mousedown(function(){
				APP.keyboard.note_on($(this).attr('id'), this);
			});
			$("div.key").mouseup(function(){
				APP.keyboard.note_off($(this).attr('id'), this);
			});
			
			$("#octaves .octiv span").click(function(){
				APP.keymap.maj_val( Number($(this).attr('id')) );
			});
		},

		note_on : function(note, that){
			
			if(APP.dur.autoStop){
				if (typeof(APP.timOut[note]) !== 'undefined') {
					APP.MidiOutput.stopNote(note, APP.channel.a);
					clearTimeout(APP.timOut[note]);
					delete APP.timOut[note];
				}
			}

			APP.MidiOutput.playNote(note, APP.channel.a,
				{ 
					'rawVelocity' : true, 
					'velocity' : APP.velo.val
				}
			);

			if(APP.dur.autoStop){
				APP.timOut[note] = setTimeout(function(){
					APP.MidiOutput.stopNote(note, APP.channel.a);
					delete APP.timOut[note];
					$(that).find('span').css('background-color', '');
					APP.keymap.note_off( note );
					
				}, APP.dur.val);
			}

			$(that).find('span').css('background-color', 'orange');

			APP.keymap.note_on( note );
		},
		note_off : function(note, that){
			if(!APP.dur.autoStop){
				$(that).find('span').css('background-color', '');
				APP.MidiOutput.stopNote(note, APP.channel.a);
				APP.keymap.note_off( note );
			}

		}

	}
	APP.d.keybMain = $("div#keyboard");
	APP.keyboard.init();
}

/***********************************************************************************************************/
/******* LISTEN KEY ****************************************************************************************/
/***********************************************************************************************************/
function init_listenkey(){
	APP.timOut = {},
	APP.keybAcceptCode = ["KeyS","KeyD","KeyG","KeyH","KeyJ","KeyZ","KeyX","KeyC","KeyV","KeyB","KeyN","KeyM"],
	APP.coresKeyNote = { KeyZ:"C", KeyX:'D', KeyC:'E', KeyV:'F', KeyB:'G', KeyN:'A', KeyM:'B', KeyS:'C#', KeyD:'D#', KeyG:'F#', KeyH:'G#', KeyJ:'A#' },
	APP.keyPressed=[],
	APP.keyOnPress=false,

	APP.body = document.querySelector('body');
	APP.body.onkeydown = function(e) {
        if (!e.metaKey) {
			//e.preventDefault(); // A REVOIR / block pour rentrer valeurs
		}
		
		if(APP.keybAcceptCode.indexOf(e.code)>=0){
			if(!APP.keyPressed[e.keyCode]){
				$("div.key[id='"+APP.coresKeyNote[e.code]+APP.keymap.oct+"']").mousedown();
				APP.keyPressed[e.keyCode]=true;
			}
		} else if(e.shiftKey) {
			APP.keymap.maj_val(APP.keymap.oct+1);
			$("div#minikeyb div[id='maj']").css('background-color', 'hotpink');
		} else if(e.ctrlKey) {
			APP.keymap.maj_val(APP.keymap.oct-1);
			$("div#minikeyb div[id='ctrl']").css('background-color', 'hotpink');
		}
    };
    APP.body.onkeyup = function(e) {
        if(APP.keybAcceptCode.indexOf(e.code)>=0){
            if(APP.keyPressed[e.keyCode]){
                $("div.key[id='"+APP.coresKeyNote[e.code]+APP.keymap.oct+"']").mouseup();
                APP.keyPressed[e.keyCode]=false;
            }
        }
        if(!e.shiftKey) {
        	$("div#minikeyb div[id='maj']").css('background-color', 'transparent');
        }
        if(!e.ctrlKey) {
        	$("div#minikeyb div[id='ctrl']").css('background-color', 'transparent');
        }
	};
}

/***********************************************************************************************************/
/******* KEYMAP ********************************************************************************************/
/***********************************************************************************************************/

function init_keymap(){
		APP.keymap = {
			oct : 4,
			init : function(){
				this.maj_val(this.oct);
			},
			maj_val : function(val){
				if(val<-1){
					val=-1;
				} else if(val>9){
					val=9;
				}
				this.oct=val;
				$("span#dispKmOct").html(val);
				$("div#bulle").remove();
				var b = "<div id='bulle' ></div>";
				$("div.key[id='C"+this.oct+"']").append(b);
			},
			note_on : function(note){
				var deb = note.substr(0, note.length-1);
				var fin = note.substr(note.length-1,1);
				if(fin==this.oct){
					$("div#minikeyb div[id='"+deb+"']").css('background-color', 'hotpink');	
				}
			},
			note_off : function(note){
				var deb = note.substr(0, note.length-1);
				var fin = note.substr(note.length-1,1);
				if(fin==this.oct){
					$("div#minikeyb div[id='"+deb+"']").css('background-color', '');	
				}
				
			}
		}
		APP.keymap.init();
	}

/***********************************************************************************************************/
/******* MODAL *********************************************************************************************/
/***********************************************************************************************************/
function init_modal(){
	
	//HELP
	$("img#btHelp").click(function(){
		$("#modal_help").show();
	});

	//KEYMAP
	$("button#open_modal_keymap").click(function(){
		$("#modal_keymap").show();
	});

	//CHOOSE CC
	$("h3#open_modal_allcc").click(function(){
		$("#modal_choose_cc").show();
	});

	//CLOSE
	$("div.modal span.close").click(function(e){
		$("div.modal").hide();
	});

}