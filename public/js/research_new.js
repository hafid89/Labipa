(function () {
    const container = document.getElementById('plants-container');
    const addBtn = document.getElementById('add-plant-btn');
    if (!container) return;

    function renumber() {
        container.querySelectorAll('.plant-row').forEach((row, idx) => {
            row.querySelector('.plant-row-title').textContent = 'Plant ' + (idx + 1);
        });
    }

    addBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'plant-row';
        row.innerHTML = `
            <div class="flex-between mb-2">
                <h3 class="plant-row-title">Plant</h3>
                <button type="button" class="remove-plant-btn">Remove</button>
            </div>
            <div class="grid-2">
                <input type="text" name="plant_name[]" class="form-input" placeholder="Plant Name *">
                <input type="text" name="owner_name[]" class="form-input" placeholder="Owner Name *">
            </div>
        `;
        container.appendChild(row);
        renumber();
        row.querySelector('.remove-plant-btn').addEventListener('click', () => {
            if (container.querySelectorAll('.plant-row').length === 1) {
                toast.error('At least 1 plant is required');
                return;
            }
            row.remove();
            renumber();
        });
    });
})();
