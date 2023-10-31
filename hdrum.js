const $=jQuery, $win = $(window);

function url(url) {
	return new URL(url, import.meta.url).href
};

const container=$('#hdrum-vidget')

if (!container.children()[0]) {
	container.html(await $.get(url('hdrum.html')));
}

const notes=[], volume0 = .6;

const ctx = new AudioContext();
const limiter = new DynamicsCompressorNode(ctx, {
	ratio: 16,
	knee:5,
	threshold: -14,
	//attack: 0,
	release: .1,
});
(window.comp = limiter)
.connect(new GainNode(ctx, {gain: 1.7}))
.connect(ctx.destination);

async function resume(buffer, note, time) {
	if (ctx.state != "running") await ctx.resume();
    const source = ctx.createBufferSource();
    const gain = new GainNode(ctx, {gain: .23});
    //gain.connect(ctx.destination);

    source.buffer = buffer;
    source.connect(gain).connect(limiter);

    if (note.source) {
    	const t = ctx.currentTime + .03;
    	note.gain.gain.linearRampToValueAtTime(0, t);
    	note.source.stop(t)
    }

    Object.assign(note, {source, gain})

    source.start(time);
    $(source).on('ended', e=>{
    	source.disconnect()
    	gain.disconnect()

    	if (note.source == source) delete note.source;
    	//console.log(source)
    })
}

function play(note) {
	if (!notes[note]) return;
	
	const {buffer, $petal, source} = notes[note];

	resume(buffer, notes[note]);

	$petal.removeClass('active');
	requestAnimationFrame(t=>$petal.addClass('active'))

	if (recording) record(note)
}

function record(note) {

	const t = ctx.currentTime*1000

	if (!localStorage[recId]) start = t
	else localStorage[recId] += ',';

	localStorage[recId] += `${note}:${Math.round(t - start)}`;
}

$('.hd-drum>div').clone().prependTo('.hd-drum')
 .find('[data-petal]').removeAttr(('data-petal'));

const loading = [];

const keys = '0123456789QWERTY';
$win.keydown(e=>{
	if (e.originalEvent.repeat) return;
	play(keys.indexOf(e.code.at(-1)))
})

const $petals = $('[data-petal]').each(async function fn(i, el){

	const note = +el.dataset.petal
	if (notes[note]) return;
	console.log(note, notes[note]);
	notes[note] = {};

	loading.push(fn);

	const $petal = $(`[data-petal="${note}"]`);

	const buffer = await fetch(url(`notes/${note||'took'}.mp3`))
    .then(res => res.arrayBuffer())
    .then(data => ctx.decodeAudioData(data));

	notes[note] = {buffer, $petal};

	$petal.on('pointerdown', function(e){

		play(note);

		let lastNote = note;

		this.setPointerCapture(e.pointerId)

		$(this).on('pointermove', function(e){

			const targ = $(document.elementFromPoint(e.clientX, e.clientY)).closest('[data-petal]')[0];
			const note = targ?.dataset.petal;

			if (note==lastNote || !(note>0)) return;

			$petals.removeClass('hover')
			.find(`[data-petal="${note}"]`).addClass('hover');
			play(note);

			lastNote = note;
		})

	}).on('pointerenter', e =>{

		$petal.addClass('hover');

	}).on('pointerleave', e =>{

		$petals.removeClass('hover')

	}).on('transitionend', e=>{

		$petal.removeClass('active')
	})

}).on('touchstart selectstart', e =>e.preventDefault());

$win.on('pointerup pointercancel blur', e=>{
	//console.log(e.type)
	$petals.off('pointermove')
})

Promise.all(loading).then(()=>console.log('all notes loaded'))

let recording = 0, start, trackId, recId, playing, trackTimers = [];

const $rec = $('.hd-rec').on('click', e=>{

	recording ^= 1; // toggle 1-0
	
	$rec.toggleClass('hd-active')

	if (recording && playing) $play.click();

	const tracksList = localStorage.hdTracks || '',
		tracksCount = tracksList.split(',').length;

	if (recording) {

		$player.removeClass('hd-active');

		recId = 'hd_record_' + tracksCount;

		localStorage[recId] = ''

	} else if (localStorage[recId])  {

		localStorage.hdTracks = tracksList + (tracksCount?',':'') + recId;
		setTrack(recId);

	} else {
		delete localStorage[recId];
		setTrack()
	}
})

const $play = $('.hd-play').on('click', e=>{

	playing ^= 1;
	$play.toggleClass('hd-active');

	if (playing) {
		trackTimers=[];

		let t0 = timeline.value

		if (t0 == timeline.max) setTime(t0 = 0);
		start = ctx.currentTime*1000 - t0;

		localStorage[trackId].split(',').forEach((el, i, {length})=>{
			let [note, time] = el.split(':')

			time -= t0;

			if (!time) play(note)
			else if (time>0) trackTimers.push(setTimeout(()=>{
				play(note);
				//if (i==length-1 && playing) $play.click()
			}, time))

			if (length==1) $play.click()
		})
	} else trackTimers.forEach(timer=>{
		clearTimeout(timer);
	})
})

function setTrack(id = localStorage.lastTrack) {

	if (!id) return;

	if (!(id in localStorage)) throw `melody ${id} does not exist!`

	trackId = localStorage.lastTrack = id;
	const track = localStorage[id];

	timeline.max = +(/\d+$/.exec(track))+100
	setTime(0)
	$player.addClass('hd-active')
}

const $player = $('.hd-player');
const $timeline = $('.hd-timeline input')
.on('input', setTime).prop({min: 0})
const timeline = $timeline[0];

//console.log($timeline);
function setTime(time) {
	if (!isNaN(time)) timeline.value = Math.min(time, timeline.max);
	const {min, max, value} = timeline;
	//console.log(value)
	if (playing && value == max) $play.click();
	timeline.parentNode.style.setProperty('--progress', (value - min)/(max - min)*100 + '%')
}

setTrack();

requestAnimationFrame(function fn(){
	requestAnimationFrame(fn);

	if (!playing) return;

	setTime(ctx.currentTime*1000 - start);
})

$win.on('blur', e=>{
	if (recording) $rec.click()
})

console.log(`11`)