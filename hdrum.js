const $=jQuery, $win = $(window);

function url(url) {
	return new URL(url, import.meta.url).href
};

const container=$('#hdrum-vidget')

if (!container.children()[0]) {
	container.html(await $.get(url('hdrum.html')));
}

const notes=[], volume0 = .6;

function play(note) {
	const {$audio, $petal} = notes[note];

	let t0 = Date.now(), started;

	$audio.each(function(){
		const audio = this;
		if (this.classList.contains('active')) {
			this.volume-=.01;
			this.classList.remove('active');
			this._intId = setInterval(()=>{
				const t = Date.now(), dt=t-t0;
				t0=t;
				let {volume} = audio;

				volume-=dt*.008
				if (volume<=0) {
					audio.pause()
					audio.currentTime = 0;
					clearInterval(audio._intId)
				} else {
					audio.volume = volume
				}

			})
		} else if (!started) {
			audio.currentTime=0;
			clearInterval(audio._intId);
			audio.volume = volume0;
			audio.classList.add('active');
			audio.play();
			started = true
		}
	})

	$petal.removeClass('active');
	requestAnimationFrame(t=>$petal.addClass('active'))

	if (recording) record(note, t0)
}

function record(note, t0) {

	if (!localStorage[trackId]) start = t0
	else localStorage[trackId] += ',';

	localStorage[trackId] += `${note}:${t0 - start}`;
}

$('.hd-drum>div').clone().prependTo('.hd-drum')
 .find('[data-petal]').removeAttr(('data-petal'));

const petals = $('[data-petal]').each((i, el)=>{

	const note = el.dataset.petal
	if (notes[note]) return;

	const $petal = $(`[data-petal="${note}"]`);

	notes[note] = {
		$audio:$('<audio></audio><audio>').prop({
			src: url(`notes/${el.dataset.petal}.mp3`),
			preload: 'auto',
		}), $petal
	}
		
	$petal.on('pointerdown', function(e){

		play(note);

		let lastNote = note;

		this.setPointerCapture(e.pointerId)

		if (note) $(this).on('pointermove', function(e){

			const targ = document.elementFromPoint(e.clientX, e.clientY).parentNode;
			const note = targ.dataset.petal;

			if (note==lastNote || !note>0) return;

			petals.removeClass('hover');
			targ.classList.add('hover');
			play(note);

			lastNote = note;
		})

	}).on('pointerenter', e =>{

		$petal.addClass('hover');

	}).on('pointerleave', e =>{

		petals.removeClass('hover')

	}).on('transitionend', e=>{

		el.classList.remove('active')
	})

}).on('touchstart', e =>e.preventDefault());

$win.on('pointerup pointercancel blur', e=>{
	//console.log(e.type)
	petals.off('pointermove')
})

let recording = 0, start, trackId, playing, trackTimers = [];

const $rec = $('.hd-rec').on('click', e=>{

	recording ^= 1; // toggle 1-0
	
	$rec.toggleClass('hd-active')
	$player[recording?'removeClass':'addClass']('hd-active');

	if (recording && playing) $play.click();

	if (recording) {

		const tracksList = localStorage.hdTracks || '',
			tracksCount = tracksList.split(',').length;

		trackId = 'hd_record' + tracksCount;

		localStorage.hdTracks = tracksList + (tracksCount?',':'') + trackId;
		localStorage[trackId] = ''
	}
})

const $play = $('.hd-play').on('click', e=>{

	playing ^= 1;
	$play.toggleClass('hd-active');

	if (playing) {
		trackTimers=[];

		localStorage[trackId].split(',').forEach((el, i, all)=>{
			const [note, time] = el.split(':')

			trackTimers.push(setTimeout(()=>{
				play(note);
				if (i==all.length-1 && playing) $play.click()
			}, time))
		})
	} else trackTimers.forEach(timer=>{
		clearTimeout(timer);
	})
})
$win.on('blur', e=>{
	if (recording) $rec.click()
})
const $player = $('.hd-player')

console.log(`11`)