// 模拟车辆数据（后续可替换为后端接口）
let scooters = [
    { id: 1, model: '小米Pro', status: 'available', location: '市中心广场A区' },
    { id: 2, model: 'Ninebot MAX', status: 'available', location: '地铁站出口' },
    { id: 3, model: '小牛电动', status: 'rented', location: '商业街北口' },
    { id: 4, model: '雅迪滑板车', status: 'available', location: '公园东门' }
];

// 动态渲染车辆列表
function renderScooters() {
    const grid = document.getElementById('scooterGrid');
    grid.innerHTML = '';
    scooters.forEach(scooter => {
        const card = document.createElement('div');
        card.className = 'scooter-card';
        card.innerHTML = `
            <h3>车辆 ID: ${scooter.id}</h3>
            <p>型号: ${scooter.model}</p>
            <p>位置: ${scooter.location}</p>
            <p>状态: <span class="${scooter.status === 'available' ? 'status-available' : 'status-rented'}">${scooter.status === 'available' ? '可租赁' : '已租赁'}</span></p>
        `;
        grid.appendChild(card);
    });
}

// 租赁表单提交
document.getElementById('rentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userName = document.getElementById('userName').value;
    const scooterId = parseInt(document.getElementById('scooterId').value);

    const scooter = scooters.find(s => s.id === scooterId);
    if (scooter && scooter.status === 'available') {
        scooter.status = 'rented';
        alert(`用户 ${userName} 成功租赁车辆 ${scooterId}！`);
        renderScooters();
        this.reset();
    } else {
        alert('车辆不存在或已被租赁！');
    }
});

// 归还表单提交
document.getElementById('returnForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const scooterId = parseInt(document.getElementById('returnScooterId').value);

    const scooter = scooters.find(s => s.id === scooterId);
    if (scooter && scooter.status === 'rented') {
        scooter.status = 'available';
        alert(`车辆 ${scooterId} 成功归还！`);
        renderScooters();
        this.reset();
    } else {
        alert('车辆不存在或未被租赁！');
    }
});

// 初始化页面
renderScooters();