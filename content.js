// content.js
(function() {
    let controller = null;

    function createUI() {
        if (document.getElementById('avatar-fitting-root')) return;

        controller = new AbortController();
        const { signal } = controller;

        const host = document.createElement('div');
        host.id = 'avatar-fitting-root';
        document.body.appendChild(host);
        const shadow = host.attachShadow({mode: 'open'});
        
        const avatarBox = document.createElement('div');
        avatarBox.id = 'avatar-box';
        avatarBox.style.cssText = 'position:fixed; top:150px; left:150px; z-index:2147483646; touch-action:none; cursor:grab;';
        avatarBox.innerHTML = AVATAR_BOX_HTML;

        const controlBox = document.createElement('div');
        controlBox.id = 'control-box';
        controlBox.style.cssText = `position:fixed; top:20px; left:${window.innerWidth - 280}px; z-index:2147483647; background:#1e1e1e; color:#fff; padding:12px; border-radius:12px; width:250px; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333; font-family:sans-serif;`;
        controlBox.innerHTML = CONTROL_BOX_HTML;
        
        const style = document.createElement('style');
        style.textContent = UI_STYLES;

        shadow.appendChild(style);
        shadow.appendChild(avatarBox);
        shadow.appendChild(controlBox);

        const canvas = shadow.getElementById('avatar-canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const brushGuide = shadow.getElementById('brush-guide');
        const ctrlContent = shadow.getElementById('ctrl-content');
        const btnMin = shadow.getElementById('btn-min');
        const ctrlDragHandle = shadow.getElementById('ctrl-drag-handle');
        const bSlider = shadow.getElementById('filter-bright');
        const cSlider = shadow.getElementById('filter-contrast');
        const sSlider = shadow.getElementById('filter-saturate');
        const brushSlider = shadow.getElementById('range-brush');
        const scaleSlider = shadow.getElementById('range-scale');
        const rotateSlider = shadow.getElementById('range-rotate'); // 추가
        const opacitySlider = shadow.getElementById('range-opacity');

        let imgObj = new Image();
        let isEraserMode = false;

        const updateGuideSize = () => {
            const r = canvas.getBoundingClientRect();
            const displaySize = brushSlider.value * (r.width / canvas.width);
            brushGuide.style.width = displaySize + 'px';
            brushGuide.style.height = displaySize + 'px';
        };

        btnMin.onclick = () => {
            const isMin = controlBox.classList.toggle('minimized');
            ctrlContent.style.display = isMin ? 'none' : 'flex';
            btnMin.innerText = isMin ? '+' : '─';
            controlBox.style.width = isMin ? '120px' : '250px';
        };

        const updateStyles = () => {
            canvas.style.filter = `brightness(${bSlider.value}) contrast(${cSlider.value}) saturate(${sSlider.value})`;
            canvas.style.opacity = opacitySlider.value;
            // 회전(rotate) 속성 추가
            canvas.style.transform = `scale(${scaleSlider.value}) rotate(${rotateSlider.value}deg)`;
            updateGuideSize();
        };
        [bSlider, cSlider, sSlider, opacitySlider, scaleSlider, rotateSlider, brushSlider].forEach(s => s.oninput = updateStyles);

        const drawImage = (src) => {
            const t = src || imgObj; if (!t.src && !t.width) return;
            canvas.width = t.width; canvas.height = t.height;
            ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(t, 0, 0);
            updateStyles();
        };

        shadow.getElementById('btn-reset').onclick = () => {
            if(confirm("모든 설정을 초기 상태로 되돌리시겠습니까?")) {
                bSlider.value = 1; cSlider.value = 1; sSlider.value = 1;
                scaleSlider.value = 1; rotateSlider.value = 0; // 기울기도 초기화
                opacitySlider.value = 1; brushSlider.value = 40;
                drawImage();
            }
        };

        const saveToSlot = (n) => {
            const currentName = shadow.getElementById(`load-${n}`).innerText;
            const lookName = prompt(`${n}번 룩의 이름을 입력하세요`, currentName);
            if (lookName === null) return;
            const data = { img: canvas.toDataURL(), name: lookName };
            chrome.storage.local.set({[`avatar_slot_${n}`]: data}, () => {
                shadow.getElementById(`load-${n}`).innerText = lookName;
                alert(`저장되었습니다.`);
            });
        };

        const loadFromSlot = (n) => {
            chrome.storage.local.get([`avatar_slot_${n}`], (res) => {
                const data = res[`avatar_slot_${n}`];
                if (data) {
                    const i = new Image();
                    const src = typeof data === 'string' ? data : data.img;
                    const name = data.name || `룩 ${n}`;
                    i.onload = () => { drawImage(i); shadow.getElementById(`load-${n}`).innerText = name; };
                    i.src = src;
                }
            });
        };

        for(let i=1; i<=6; i++) {
            chrome.storage.local.get([`avatar_slot_${i}`], (res) => {
                const data = res[`avatar_slot_${i}`];
                if(data && data.name) shadow.getElementById(`load-${i}`).innerText = data.name;
            });
        }

        shadow.querySelectorAll('.save-btn').forEach(b => b.onclick = () => saveToSlot(b.dataset.slot));
        shadow.querySelectorAll('.slot-btn').forEach(b => b.onclick = () => loadFromSlot(b.dataset.slot));

        let isMovingAvatar = false, isPainting = false, isMovingCtrl = false, lastX, lastY;
        avatarBox.onmousedown = (e) => {
            if (isEraserMode) { 
                isPainting = true; 
                const r = canvas.getBoundingClientRect(); 
                lastX = (e.clientX - r.left) * (canvas.width / r.width); 
                lastY = (e.clientY - r.top) * (canvas.height / r.height); 
            } else { isMovingAvatar = true; lastX = e.clientX; lastY = e.clientY; }
        };
        ctrlDragHandle.onmousedown = (e) => { if (e.target !== btnMin) { isMovingCtrl = true; lastX = e.clientX; lastY = e.clientY; } };

        window.addEventListener('mousemove', (e) => {
            if (isMovingCtrl) {
                controlBox.style.left = (parseInt(controlBox.style.left) + (e.clientX - lastX)) + 'px';
                controlBox.style.top = (parseInt(controlBox.style.top) + (e.clientY - lastY)) + 'px';
                lastX = e.clientX; lastY = e.clientY;
            }
            if (isMovingAvatar) {
                avatarBox.style.left = (avatarBox.offsetLeft + (e.clientX - lastX)) + 'px';
                avatarBox.style.top = (avatarBox.offsetTop + (e.clientY - lastY)) + 'px';
                lastX = e.clientX; lastY = e.clientY;
            }
            if (isEraserMode) {
                brushGuide.style.display = 'block'; brushGuide.style.left = e.clientX + 'px'; brushGuide.style.top = e.clientY + 'px';
                if (isPainting) {
                    const r = canvas.getBoundingClientRect();
                    const curX = (e.clientX - r.left) * (canvas.width / r.width);
                    const curY = (e.clientY - r.top) * (canvas.height / r.height);
                    ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = brushSlider.value; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(curX, curY); ctx.stroke();
                    lastX = curX; lastY = curY;
                }
            } else { brushGuide.style.display = 'none'; }
        }, { signal });

        window.addEventListener('mouseup', () => { isMovingAvatar = false; isPainting = false; isMovingCtrl = false; }, { signal });

        canvas.addEventListener('mouseleave', () => { brushGuide.style.display = 'none'; canvas.classList.remove('hide-cursor'); });
        canvas.addEventListener('mouseenter', () => { if (isEraserMode) { brushGuide.style.display = 'block'; canvas.classList.add('hide-cursor'); } });

        shadow.getElementById('mode-move').onclick = () => { 
            isEraserMode = false; shadow.getElementById('mode-move').classList.add('active'); shadow.getElementById('mode-erase').classList.remove('active');
            brushGuide.style.display = 'none'; canvas.classList.remove('hide-cursor');
        };
        shadow.getElementById('mode-erase').onclick = () => { 
            isEraserMode = true; shadow.getElementById('mode-erase').classList.add('active'); shadow.getElementById('mode-move').classList.remove('active');
        };

        shadow.getElementById('btn-upload').onclick = () => { 
            const up = document.createElement('input'); up.type = 'file'; 
            up.onchange = (e) => { 
                const r = new FileReader(); 
                r.onload = (ev) => { imgObj.onload = () => drawImage(); imgObj.src = ev.target.result; }; 
                r.readAsDataURL(e.target.files[0]); 
            }; 
            up.click(); 
        };
        
        shadow.getElementById('btn-flip').onclick = () => {
            const temp = document.createElement('canvas'); temp.width = canvas.width; temp.height = canvas.height;
            temp.getContext('2d').drawImage(canvas, 0, 0);
            ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.globalCompositeOperation = 'source-over'; ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
            ctx.drawImage(temp, 0, 0); ctx.restore();
            if (isEraserMode) ctx.globalCompositeOperation = 'destination-out';
        };
        
        chrome.storage.local.get(['avatarData'], (res) => { if(res.avatarData) { imgObj.onload = () => drawImage(); imgObj.src = res.avatarData; } });
    }

    function removeUI() { const root = document.getElementById('avatar-fitting-root'); if (root) root.remove(); if (controller) controller.abort(); }
    chrome.storage.local.get(['enabled'], (res) => { if (res.enabled !== false) createUI(); });
    chrome.storage.onChanged.addListener((changes) => { if (changes.enabled) { if (changes.enabled.newValue) createUI(); else removeUI(); } });
})();