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
        
        // 1. 아바타 박스
        const avatarBox = document.createElement('div');
        avatarBox.id = 'avatar-box';
        avatarBox.style.cssText = 'position:fixed; top:150px; left:150px; z-index:2147483646; touch-action:none; cursor:grab;';
        avatarBox.innerHTML = '<div id="canvas-wrapper"><canvas id="avatar-canvas"></canvas></div>';

        // 2. 리모컨 박스 (z-index 최상위)
        const controlBox = document.createElement('div');
        controlBox.id = 'control-box';
        controlBox.style.cssText = `position:fixed; top:20px; left:${window.innerWidth - 280}px; z-index:2147483647; background:#1e1e1e; color:#fff; padding:12px; border-radius:12px; width:250px; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333; font-family:sans-serif;`;
        controlBox.innerHTML = CONTROL_BOX_HTML;

        // 3. 지우개 가이드 (Shadow Root에 추가하여 계층 분리)
        const brushGuide = document.createElement('div');
        brushGuide.id = 'brush-guide';
        
        const style = document.createElement('style');
        style.textContent = UI_STYLES;

        shadow.appendChild(style);
        shadow.appendChild(avatarBox);
        shadow.appendChild(controlBox);
        shadow.appendChild(brushGuide);

        const canvas = shadow.getElementById('avatar-canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const ctrlContent = shadow.getElementById('ctrl-content');
        const btnMin = shadow.getElementById('btn-min');
        const btnVisibility = shadow.getElementById('btn-visibility');
        const ctrlDragHandle = shadow.getElementById('ctrl-drag-handle');
        
        const bSlider = shadow.getElementById('filter-bright');
        const cSlider = shadow.getElementById('filter-contrast');
        const sSlider = shadow.getElementById('filter-saturate');
        const brushSlider = shadow.getElementById('range-brush');
        const scaleSlider = shadow.getElementById('range-scale');
        const rotateSlider = shadow.getElementById('range-rotate'); 
        const opacitySlider = shadow.getElementById('range-opacity');

        let imgObj = new Image();
        let resetState = null;
        let hasImage = false;
        let isEraserMode = false;
        let isAvatarVisible = true;
        let isAdjustingBrush = false; // 슬라이더 조절 중 여부
        let isOverControl = false;    // 마우스가 리모컨 위에 있는지 여부
        const defaultStyleState = {
            brightness: '1',
            contrast: '1',
            saturate: '1',
            scale: '1',
            rotate: '0',
            opacity: '1'
        };

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const moveControlBox = (left, top) => {
            const rect = controlBox.getBoundingClientRect();
            const margin = 8;
            const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
            const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

            controlBox.style.left = clamp(left, margin, maxLeft) + 'px';
            controlBox.style.top = clamp(top, margin, maxTop) + 'px';
        };

        const updateGuideSize = () => {
            const canvasWidth = canvas.offsetWidth || canvas.width;
            const displaySize = brushSlider.value * (canvasWidth / canvas.width) * scaleSlider.value;
            brushGuide.style.width = displaySize + 'px';
            brushGuide.style.height = displaySize + 'px';
        };

        const updateStyles = () => {
            canvas.style.filter = `brightness(${bSlider.value}) contrast(${cSlider.value}) saturate(${sSlider.value})`;
            canvas.style.opacity = opacitySlider.value;
            canvas.style.transform = `scale(${scaleSlider.value}) rotate(${rotateSlider.value}deg)`;
            updateGuideSize();
        };

        [bSlider, cSlider, sSlider, opacitySlider, scaleSlider, rotateSlider, brushSlider].forEach(s => s.oninput = updateStyles);

        const drawImage = (src) => {
            const t = src || imgObj; if (!t.src && !t.width) return;
            canvas.width = t.width; canvas.height = t.height;
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(t, 0, 0);
            hasImage = true;
            updateStyles();
        };

        const hasDrawableImage = () => hasImage && canvas.width > 0 && canvas.height > 0;

        const requireImage = () => {
            if (hasDrawableImage()) return true;
            alert('먼저 사진을 업로드하거나 룩을 불러와 주세요.');
            return false;
        };

        const getCanvasPoint = (e) => {
            const boxRect = avatarBox.getBoundingClientRect();
            const canvasWidth = canvas.offsetWidth || canvas.width;
            const canvasHeight = canvas.offsetHeight || canvas.height;
            const style = getComputedStyle(canvas);
            const transform = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
            const [originX, originY] = style.transformOrigin.split(' ').map(value => parseFloat(value));
            const point = new DOMPoint(e.clientX - boxRect.left, e.clientY - boxRect.top);
            const matrix = new DOMMatrix()
                .translate(originX, originY)
                .multiply(transform)
                .translate(-originX, -originY);
            const localPoint = point.matrixTransform(matrix.inverse());

            return {
                x: localPoint.x * (canvas.width / canvasWidth),
                y: localPoint.y * (canvas.height / canvasHeight)
            };
        };

        const getCurrentStyleState = () => ({
            brightness: bSlider.value,
            contrast: cSlider.value,
            saturate: sSlider.value,
            scale: scaleSlider.value,
            rotate: rotateSlider.value,
            opacity: opacitySlider.value
        });

        const applyStyleState = (style = defaultStyleState) => {
            const nextStyle = { ...defaultStyleState, ...style };
            bSlider.value = nextStyle.brightness;
            cSlider.value = nextStyle.contrast;
            sSlider.value = nextStyle.saturate;
            scaleSlider.value = nextStyle.scale;
            rotateSlider.value = nextStyle.rotate;
            opacitySlider.value = nextStyle.opacity;
            updateStyles();
        };

        const setResetState = (img, style = defaultStyleState) => {
            resetState = { img, style: { ...defaultStyleState, ...style } };
        };

        const persistAvatarState = (img, style = defaultStyleState) => {
            chrome.storage.local.set({
                avatarState: {
                    img,
                    style: { ...defaultStyleState, ...style }
                }
            });
        };

        const restoreResetState = () => {
            if (!resetState?.img) {
                applyStyleState();
                drawImage();
                return;
            }

            const state = resetState;
            const resetImage = new Image();
            resetImage.onload = () => {
                drawImage(resetImage);
                applyStyleState(state.style);
            };
            resetImage.src = state.img;
        };

        btnMin.onclick = () => {
            const isMin = controlBox.classList.toggle('minimized');
            ctrlContent.style.display = isMin ? 'none' : 'flex';
            btnMin.innerText = isMin ? '+' : '─';
            controlBox.style.width = isMin ? '150px' : '250px';
            moveControlBox(parseInt(controlBox.style.left), parseInt(controlBox.style.top));
        };

        btnVisibility.onclick = () => {
            isAvatarVisible = !isAvatarVisible;
            avatarBox.style.display = isAvatarVisible ? 'block' : 'none';
            btnVisibility.innerText = isAvatarVisible ? '숨김' : '보기';
            brushGuide.style.display = 'none';
            canvas.classList.remove('hide-cursor');
        };

        shadow.getElementById('btn-reset').onclick = () => {
            if (!requireImage()) return;
            if(confirm("모든 설정을 초기 상태로 되돌리시겠습니까?")) {
                restoreResetState();
            }
        };

        // 지우개 슬라이더 이벤트: 조절 중일 때는 가이드를 무조건 표시
        brushSlider.onmousedown = () => { isAdjustingBrush = true; };
        
        // 리모컨 영역 진입/이탈 감지
        controlBox.onmouseenter = () => { isOverControl = true; };
        controlBox.onmouseleave = () => { isOverControl = false; };

        const saveToSlot = (n) => {
            if (!requireImage()) return;
            const currentName = shadow.getElementById(`load-${n}`).innerText;
            const lookName = prompt(`${n}번 룩의 이름을 입력하세요`, currentName);
            if (lookName === null) return;
            const data = { img: canvas.toDataURL(), name: lookName, style: getCurrentStyleState() };
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
                    const style = typeof data === 'string' ? defaultStyleState : data.style;
                    i.onload = () => {
                        drawImage(i);
                        applyStyleState(style);
                        setResetState(src, style);
                        persistAvatarState(src, style);
                        shadow.getElementById(`load-${n}`).innerText = name;
                    };
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
                if (!hasDrawableImage()) return;
                isPainting = true; 
                const point = getCanvasPoint(e);
                lastX = point.x;
                lastY = point.y;
            } else { isMovingAvatar = true; lastX = e.clientX; lastY = e.clientY; }
        };

        ctrlDragHandle.onmousedown = (e) => { if (!e.target.closest('button')) { isMovingCtrl = true; lastX = e.clientX; lastY = e.clientY; } };

        window.addEventListener('mousemove', (e) => {
            if (isMovingCtrl) {
                moveControlBox(
                    parseInt(controlBox.style.left) + (e.clientX - lastX),
                    parseInt(controlBox.style.top) + (e.clientY - lastY)
                );
                lastX = e.clientX; lastY = e.clientY;
            }
            if (isMovingAvatar) {
                avatarBox.style.left = (avatarBox.offsetLeft + (e.clientX - lastX)) + 'px';
                avatarBox.style.top = (avatarBox.offsetTop + (e.clientY - lastY)) + 'px';
                lastX = e.clientX; lastY = e.clientY;
            }
            
            // ★ 가이드 노출 조건 로직
            // 1. 슬라이더 조절 중이면 무조건 표시
            // 2. 리모컨 영역 밖이고 지우개 모드이면 표시
            // 3. 리모컨 영역 안이면 슬라이더 조절 중일 때만 표시 (그 외엔 숨김)
            if (isAdjustingBrush || (!isOverControl && isEraserMode)) {
                brushGuide.style.display = 'block';
                brushGuide.style.left = e.clientX + 'px';
                brushGuide.style.top = e.clientY + 'px';
                
                if (isPainting && isEraserMode) {
                    const point = getCanvasPoint(e);
                    const curX = point.x;
                    const curY = point.y;
                    ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = brushSlider.value; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(curX, curY); ctx.stroke();
                    lastX = curX; lastY = curY;
                }
            } else {
                brushGuide.style.display = 'none';
            }
        }, { signal });

        window.addEventListener('mouseup', () => { 
            isMovingAvatar = false; isPainting = false; isMovingCtrl = false; isAdjustingBrush = false; 
        }, { signal });

        window.addEventListener('resize', () => {
            moveControlBox(parseInt(controlBox.style.left), parseInt(controlBox.style.top));
        }, { signal });

        canvas.addEventListener('mouseleave', () => { canvas.classList.remove('hide-cursor'); });
        canvas.addEventListener('mouseenter', () => { if (isEraserMode && !isOverControl) canvas.classList.add('hide-cursor'); });

        shadow.getElementById('mode-move').onclick = () => { 
            isEraserMode = false; shadow.getElementById('mode-move').classList.add('active'); shadow.getElementById('mode-erase').classList.remove('active');
            brushGuide.style.display = 'none'; canvas.classList.remove('hide-cursor');
        };
        shadow.getElementById('mode-erase').onclick = () => { 
            if (!requireImage()) return;
            isEraserMode = true; shadow.getElementById('mode-erase').classList.add('active'); shadow.getElementById('mode-move').classList.remove('active');
        };

        shadow.getElementById('btn-upload').onclick = () => { 
            const up = document.createElement('input'); up.type = 'file'; up.accept = 'image/*'; 
            up.onchange = (e) => { 
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    alert('이미지 파일만 업로드할 수 있습니다.');
                    return;
                }
                const r = new FileReader(); 
                r.onload = (ev) => {
                    setResetState(ev.target.result);
                    persistAvatarState(ev.target.result);
                    imgObj.onload = () => {
                        drawImage();
                        applyStyleState();
                    };
                    imgObj.src = ev.target.result;
                };
                r.onerror = () => alert('사진을 불러오지 못했습니다. 다시 시도해 주세요.');
                r.readAsDataURL(file); 
            }; 
            up.click(); 
        };
        
        shadow.getElementById('btn-flip').onclick = () => {
            if (!requireImage()) return;
            const temp = document.createElement('canvas'); temp.width = canvas.width; temp.height = canvas.height;
            temp.getContext('2d').drawImage(canvas, 0, 0);
            ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.globalCompositeOperation = 'source-over'; ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
            ctx.drawImage(temp, 0, 0); ctx.restore();
            if (isEraserMode) ctx.globalCompositeOperation = 'destination-out';
        };
        
        chrome.storage.local.get(['avatarState'], (res) => {
            const state = res.avatarState;
            if(state?.img) {
                setResetState(state.img, state.style);
                imgObj.onload = () => {
                    drawImage();
                    applyStyleState(state.style);
                };
                imgObj.src = state.img;
            }
        });
    }

    function removeUI() {
        const root = document.getElementById('avatar-fitting-root');
        if (root) root.remove();
        if (controller) { controller.abort(); controller = null; }
    }

    chrome.storage.local.get(['enabled'], (res) => {
        if (res.enabled !== false) createUI();
    });

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.enabled) {
            if (changes.enabled.newValue) createUI();
            else removeUI();
        }
    });
})();
