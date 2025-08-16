// ========== APPLICATION STATE ========== 
class InsuranceApp {
    constructor() {
        this.tableData = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.recordsPerPage = 10;
        this.sortColumn = '';
        this.sortDirection = 'asc';
        this.editingIndex = -1;
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.renderTable();
        this.updateStats();
        this.setupDateDefaults();
    }

    // ========== EVENT BINDINGS ==========
    bindEvents() {
        // Sort headers
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                const column = e.target.getAttribute('data-sort');
                this.sortTable(column);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterTable());
        }

        // Form validation on input
        this.setupValidation();
    }

    setupValidation() {
        const requiredFields = ['custName', 'phone', 'plate', 'model', 'year', 'insuranceType'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => this.clearError(fieldId));
            }
        });
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (!field || !errorElement) return true;

        let isValid = true;
        let errorMessage = '';

        // Check if required field is empty
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'กรุณากรอกข้อมูลในช่องนี้';
        }

        // Specific validation rules
        switch (fieldId) {
            case 'phone':
                const phonePattern = /^[0-9]{10}$/;
                if (field.value && !phonePattern.test(field.value.replace(/-/g, ''))) {
                    isValid = false;
                    errorMessage = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)';
                }
                break;
            
            case 'year':
                const currentYear = new Date().getFullYear();
                const year = parseInt(field.value);
                if (field.value && (year < 1900 || year > currentYear + 1)) {
                    isValid = false;
                    errorMessage = `กรุณากรอกปีรถระหว่าง 1900 - ${currentYear + 1}`;
                }
                break;
            
            case 'custName':
                if (field.value && field.value.length < 2) {
                    isValid = false;
                    errorMessage = 'กรุณากรอกชื่อลูกค้าอย่างน้อย 2 ตัวอักษร';
                }
                break;
        }

        // Show/hide error
        if (!isValid) {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
            field.style.borderColor = 'var(--danger-color)';
        } else {
            this.clearError(fieldId);
        }

        return isValid;
    }

    clearError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field && errorElement) {
            errorElement.classList.remove('show');
            field.style.borderColor = '';
        }
    }

    validateForm() {
        const requiredFields = ['custName', 'phone', 'plate', 'model', 'year', 'insuranceType'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // ========== UTILITY FUNCTIONS ==========
    setupDateDefaults() {
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const nextYearStr = nextYear.toISOString().split('T')[0];

        // Set default dates
        document.getElementById('startPRB').value = today;
        document.getElementById('endPRB').value = nextYearStr;
        document.getElementById('startVOL').value = today;
        document.getElementById('endVOL').value = nextYearStr;
    }

    showAlert(message, type = 'success') {
        const alertContainer = document.getElementById('alertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 'exclamation-triangle';
        
        alertDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('show', show);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('th-TH', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('th-TH');
    }

    // ========== TOGGLE FUNCTIONS ==========
    toggleMemberCode() {
        const memberLevel = document.getElementById('memberLevel').value;
        const memberCodeInput = document.getElementById('memberCode');
        memberCodeInput.style.display = memberLevel === 'ไม่เป็นสมาชิก' ? 'none' : 'block';
        if (memberLevel === 'ไม่เป็นสมาชิก') {
            memberCodeInput.value = '';
        }
    }

    toggleDocAddress() {
        const docAddressType = document.getElementById('docAddressType').value;
        const docAddress = document.getElementById('docAddress');
        docAddress.classList.toggle('hidden', docAddressType !== 'ที่อยู่อื่น');
    }

    toggleOtherUseType() {
        const useType = document.getElementById('useType').value;
        const otherUseType = document.getElementById('otherUseType');
        otherUseType.classList.toggle('hidden', useType !== 'อื่นๆ');
    }

    togglePolicySub() {
        const insuranceType = document.getElementById('insuranceType').value;
        const container = document.getElementById('policySubContainer');
        container.style.display = insuranceType.includes('สมัครใจ') ? 'block' : 'none';
    }

    togglePaymentPlan() {
        const paymentType = document.getElementById('paymentType').value;
        const isInstallment = paymentType === 'ผ่อนชำระ';
        document.getElementById('paymentMonth').classList.toggle('hidden', !isInstallment);
        document.getElementById('paymentOther').classList.toggle('hidden', !isInstallment);
    }

    // ========== CALCULATION FUNCTIONS ==========
    calcTotal() {
        const prb = parseFloat(document.getElementById('premiumPRB').value) || 0;
        const prbDisc = parseFloat(document.getElementById('discountPRB').value) || 0;
        const vol = parseFloat(document.getElementById('premiumVOL').value) || 0;
        const volDisc = parseFloat(document.getElementById('discountVOL').value) || 0;
        
        const total = (prb - prbDisc) + (vol - volDisc);
        document.getElementById('totalPremium').value = this.formatCurrency(total);
    }

    // ========== DATA MANAGEMENT ==========
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem('insuranceData');
            if (savedData) {
                this.tableData = JSON.parse(savedData);
                this.filteredData = [...this.tableData];
            }
        } catch (error) {
            console.error('Error loading data from storage:', error);
            this.showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('insuranceData', JSON.stringify(this.tableData));
        } catch (error) {
            console.error('Error saving data to storage:', error);
            this.showAlert('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        }
    }

    generateRecordData() {
        const formData = {
            id: this.editingIndex >= 0 ? this.tableData[this.editingIndex].id : Date.now().toString(),
            timestamp: this.editingIndex >= 0 ? this.tableData[this.editingIndex].timestamp : new Date().toISOString(),
            custName: document.getElementById('custName').value.trim(),
            memberLevel: document.getElementById('memberLevel').value,
            memberCode: document.getElementById('memberCode').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            docAddressType: document.getElementById('docAddressType').value,
            docAddress: document.getElementById('docAddressType').value === 'ที่อยู่อื่น' 
                ? document.getElementById('docAddress').value.trim() 
                : 'ตามบัตรประชาชน',
            plate: document.getElementById('plate').value.trim().toUpperCase(),
            model: document.getElementById('model').value.trim(),
            year: document.getElementById('year').value.trim(),
            engineNo: document.getElementById('engineNo').value.trim(),
            vin: document.getElementById('vin').value.trim(),
            cc: document.getElementById('cc').value.trim(),
            seat: document.getElementById('seat').value.trim(),
            color: document.getElementById('color').value.trim(),
            accessory: document.getElementById('accessory').value.trim(),
            useType: document.getElementById('useType').value === 'อื่นๆ' 
                ? document.getElementById('otherUseType').value.trim() 
                : document.getElementById('useType').value,
            insuranceType: document.getElementById('insuranceType').value,
            policySubType: document.getElementById('policySubType').value,
            companyPRB: document.getElementById('companyPRB').value,
            premiumPRB: parseFloat(document.getElementById('premiumPRB').value) || 0,
            discountPRB: parseFloat(document.getElementById('discountPRB').value) || 0,
            companyVOL: document.getElementById('companyVOL').value,
            premiumVOL: parseFloat(document.getElementById('premiumVOL').value) || 0,
            discountVOL: parseFloat(document.getElementById('discountVOL').value) || 0,
            totalAmount: parseFloat(document.getElementById('totalPremium').value.replace(/,/g, '')) || 0,
            startPRB: document.getElementById('startPRB').value,
            endPRB: document.getElementById('endPRB').value,
            startVOL: document.getElementById('startVOL').value,
            endVOL: document.getElementById('endVOL').value,
            paymentType: this.getPaymentTypeString()
        };

        return formData;
    }

    getPaymentTypeString() {
        const paymentType = document.getElementById('paymentType').value;
        if (paymentType === 'ผ่อนชำระ') {
            const month = document.getElementById('paymentMonth').value;
            const other = document.getElementById('paymentOther').value;
            return month === 'other' && other ? `ผ่อน ${other} เดือน` : `ผ่อน ${month.replace('m', '')} เดือน`;
        }
        return paymentType;
    }

    addRecord() {
        if (!this.validateForm()) {
            this.showAlert('กรุณาตรวจสอบข้อมูลที่กรอกให้ถูกต้อง', 'error');
            return;
        }

        this.calcTotal();
        const recordData = this.generateRecordData();

        try {
            if (this.editingIndex >= 0) {
                // Update existing record
                this.tableData[this.editingIndex] = recordData;
                this.showAlert('อัปเดตข้อมูลเรียบร้อย', 'success');
                this.editingIndex = -1;
            } else {
                // Add new record
                this.tableData.push(recordData);
                this.showAlert('บันทึกข้อมูลเรียบร้อย', 'success');
            }

            this.saveToStorage();
            this.filteredData = [...this.tableData];
            this.renderTable();
            this.updateStats();
            this.clearForm();

        } catch (error) {
            console.error('Error adding record:', error);
            this.showAlert('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        }
    }

    editRecord(index) {
        if (index >= 0 && index < this.filteredData.length) {
            const record = this.filteredData[index];
            this.editingIndex = this.tableData.findIndex(item => item.id === record.id);
            this.populateForm(record);
            document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
            this.showAlert('กำลังแก้ไขข้อมูล - กรุณาทำการปรับปรุงและบันทึกใหม่', 'info');
        }
    }

    populateForm(record) {
        // Basic info
        document.getElementById('custName').value = record.custName || '';
        document.getElementById('memberLevel').value = record.memberLevel || 'ไม่เป็นสมาชิก';
        document.getElementById('memberCode').value = record.memberCode || '';
        document.getElementById('phone').value = record.phone || '';
        document.getElementById('address').value = record.address || '';
        
        // Document address
        if (record.docAddress && record.docAddress !== 'ตามบัตรประชาชน') {
            document.getElementById('docAddressType').value = 'ที่อยู่อื่น';
            document.getElementById('docAddress').value = record.docAddress;
        } else {
            document.getElementById('docAddressType').value = 'ตามบัตรประชาชน';
        }

        // Car info
        document.getElementById('plate').value = record.plate || '';
        document.getElementById('model').value = record.model || '';
        document.getElementById('year').value = record.year || '';
        document.getElementById('engineNo').value = record.engineNo || '';
        document.getElementById('vin').value = record.vin || '';
        document.getElementById('cc').value = record.cc || '';
        document.getElementById('seat').value = record.seat || '';
        document.getElementById('color').value = record.color || '';
        document.getElementById('accessory').value = record.accessory || '';

        // Use type
        const knownUseTypes = ['ใช้ส่วนบุคคล', 'รับจ้าง'];
        if (knownUseTypes.includes(record.useType)) {
            document.getElementById('useType').value = record.useType;
        } else {
            document.getElementById('useType').value = 'อื่นๆ';
            document.getElementById('otherUseType').value = record.useType;
        }

        // Insurance info
        document.getElementById('insuranceType').value = record.insuranceType || '';
        document.getElementById('policySubType').value = record.policySubType || '';
        document.getElementById('companyPRB').value = record.companyPRB || '';
        document.getElementById('premiumPRB').value = record.premiumPRB || 0;
        document.getElementById('discountPRB').value = record.discountPRB || 0;
        document.getElementById('companyVOL').value = record.companyVOL || '';
        document.getElementById('premiumVOL').value = record.premiumVOL || 0;
        document.getElementById('discountVOL').value = record.discountVOL || 0;
        document.getElementById('startPRB').value = record.startPRB || '';
        document.getElementById('endPRB').value = record.endPRB || '';
        document.getElementById('startVOL').value = record.startVOL || '';
        document.getElementById('endVOL').value = record.endVOL || '';

        // Payment type
        if (record.paymentType && record.paymentType.includes('ผ่อน')) {
            document.getElementById('paymentType').value = 'ผ่อนชำระ';
            // Extract month info from payment type string
            if (record.paymentType.includes('3')) {
                document.getElementById('paymentMonth').value = '3m';
            } else if (record.paymentType.includes('6')) {
                document.getElementById('paymentMonth').value = '6m';
            } else if (record.paymentType.includes('10')) {
                document.getElementById('paymentMonth').value = '10m';
            } else {
                document.getElementById('paymentMonth').value = 'other';
                document.getElementById('paymentOther').value = record.paymentType.replace('ผ่อน ', '').replace(' เดือน', '');
            }
        } else {
            document.getElementById('paymentType').value = 'เต็มจำนวน';
        }

        // Update toggles
        this.toggleMemberCode();
        this.toggleDocAddress();
        this.toggleOtherUseType();
        this.togglePolicySub();
        this.togglePaymentPlan();
        this.calcTotal();
    }

    deleteRecord(index) {
        if (index >= 0 && index < this.filteredData.length) {
            const record = this.filteredData[index];
            
            if (confirm(`ต้องการลบรายการของ "${record.custName}" หรือไม่?`)) {
                const originalIndex = this.tableData.findIndex(item => item.id === record.id);
                if (originalIndex >= 0) {
                    this.tableData.splice(originalIndex, 1);
                    this.saveToStorage();
                    this.filteredData = [...this.tableData];
                    this.renderTable();
                    this.updateStats();
                    this.showAlert('ลบข้อมูลเรียบร้อย', 'success');
                }
            }
        }
    }

    clearForm() {
        document.getElementById('formInsurance').reset();
        
        // Reset number inputs
        document.getElementById('premiumPRB').value = '0';
        document.getElementById('discountPRB').value = '0';
        document.getElementById('premiumVOL').value = '0';
        document.getElementById('discountVOL').value = '0';
        document.getElementById('totalPremium').value = '0.00';
        
        // Reset toggles
        this.toggleMemberCode();
        this.toggleDocAddress();
        this.toggleOtherUseType();
        this.togglePolicySub();
        this.togglePaymentPlan();
        
        // Clear validation errors
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
        });
        
        document.querySelectorAll('input').forEach(input => {
            input.style.borderColor = '';
        });

        this.editingIndex = -1;
        this.setupDateDefaults();
    }

    // ========== TABLE MANAGEMENT ==========
    renderTable() {
        const tbody = document.querySelector('#tableRecords tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        pageData.forEach((record, index) => {
            const row = this.createTableRow(record, startIndex + index);
            tbody.appendChild(row);
        });

        this.updatePagination();
        this.updateTableInfo();
    }

    createTableRow(record, index) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><input type="checkbox" class="row-select" data-index="${index}"></td>
            <td>${record.custName}</td>
            <td>${record.memberLevel}</td>
            <td>${record.memberCode}</td>
            <td>${record.phone}</td>
            <td title="${record.address}">${this.truncateText(record.address, 30)}</td>
            <td><strong>${record.plate}</strong></td>
            <td>${record.model}</td>
            <td>${record.year}</td>
            <td>
                <span class="badge badge-${this.getInsuranceBadgeClass(record.insuranceType)}">
                    ${record.insuranceType}
                </span>
            </td>
            <td class="text-right"><strong>${this.formatCurrency(record.totalAmount)} บาท</strong></td>
            <td>${this.formatDate(record.timestamp)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="app.viewRecord(${index})" title="ดูรายละเอียด">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="app.editRecord(${index})" title="แก้ไข">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn del" onclick="app.deleteRecord(${index})" title="ลบ">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    getInsuranceBadgeClass(insuranceType) {
        switch (insuranceType) {
            case 'พรบ': return 'primary';
            case 'สมัครใจ': return 'success';
            case 'พรบ+สมัครใจ': return 'warning';
            default: return 'secondary';
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    viewRecord(index) {
        if (index >= 0 && index < this.filteredData.length) {
            const record = this.filteredData[index];
            this.showRecordDetail(record);
        }
    }

    showRecordDetail(record) {
        const modal = document.getElementById('detailModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="record-detail">
                <div class="detail-section">
                    <h4><i class="fas fa-user"></i> ข้อมูลลูกค้า</h4>
                    <div class="detail-grid">
                        <div><strong>ชื่อลูกค้า:</strong> ${record.custName}</div>
                        <div><strong>ระดับสมาชิก:</strong> ${record.memberLevel}</div>
                        <div><strong>รหัสสมาชิก:</strong> ${record.memberCode || '-'}</div>
                        <div><strong>เบอร์โทร:</strong> ${record.phone}</div>
                        <div><strong>ที่อยู่:</strong> ${record.address || '-'}</div>
                        <div><strong>ที่อยู่จัดส่ง:</strong> ${record.docAddress}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-car"></i> ข้อมูลรถยนต์</h4>
                    <div class="detail-grid">
                        <div><strong>ทะเบียน:</strong> ${record.plate}</div>
                        <div><strong>ยี่ห้อ/รุ่น:</strong> ${record.model}</div>
                        <div><strong>ปี:</strong> ${record.year}</div>
                        <div><strong>เลขเครื่อง:</strong> ${record.engineNo || '-'}</div>
                        <div><strong>VIN:</strong> ${record.vin || '-'}</div>
                        <div><strong>ซีซี:</strong> ${record.cc || '-'}</div>
                        <div><strong>จำนวนที่นั่ง:</strong> ${record.seat || '-'}</div>
                        <div><strong>สี:</strong> ${record.color || '-'}</div>
                        <div><strong>อุปกรณ์:</strong> ${record.accessory || '-'}</div>
                        <div><strong>การใช้งาน:</strong> ${record.useType}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-shield-alt"></i> ข้อมูลประกัน</h4>
                    <div class="detail-grid">
                        <div><strong>ประเภท:</strong> ${record.insuranceType}</div>
                        <div><strong>ประเภทสมัครใจ:</strong> ${record.policySubType || '-'}</div>
                        <div><strong>บริษัท พรบ:</strong> ${record.companyPRB || '-'}</div>
                        <div><strong>เบี้ย พรบ:</strong> ${this.formatCurrency(record.premiumPRB)} บาท</div>
                        <div><strong>ส่วนลด พรบ:</strong> ${this.formatCurrency(record.discountPRB)} บาท</div>
                        <div><strong>บริษัทสมัครใจ:</strong> ${record.companyVOL || '-'}</div>
                        <div><strong>เบี้ยสมัครใจ:</strong> ${this.formatCurrency(record.premiumVOL)} บาท</div>
                        <div><strong>ส่วนลดสมัครใจ:</strong> ${this.formatCurrency(record.discountVOL)} บาท</div>
                        <div class="total-row"><strong>ยอดรวม:</strong> <span class="total-amount">${this.formatCurrency(record.totalAmount)} บาท</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-calendar"></i> วันที่คุ้มครอง</h4>
                    <div class="detail-grid">
                        <div><strong>พรบ เริ่ม:</strong> ${this.formatDate(record.startPRB)}</div>
                        <div><strong>พรบ หมด:</strong> ${this.formatDate(record.endPRB)}</div>
                        <div><strong>สมัครใจ เริ่ม:</strong> ${this.formatDate(record.startVOL)}</div>
                        <div><strong>สมัครใจ หมด:</strong> ${this.formatDate(record.endVOL)}</div>
                        <div><strong>การชำระ:</strong> ${record.paymentType}</div>
                        <div><strong>วันที่บันทึก:</strong> ${this.formatDate(record.timestamp)}</div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('detailModal');
        modal.style.display = 'none';
    }

    // ========== SEARCH AND FILTER ==========
    filterTable() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredData = [...this.tableData];
        } else {
            this.filteredData = this.tableData.filter(record => {
                return (
                    record.custName.toLowerCase().includes(searchTerm) ||
                    record.phone.includes(searchTerm) ||
                    record.plate.toLowerCase().includes(searchTerm) ||
                    record.model.toLowerCase().includes(searchTerm) ||
                    record.insuranceType.toLowerCase().includes(searchTerm) ||
                    record.companyPRB.toLowerCase().includes(searchTerm) ||
                    record.companyVOL.toLowerCase().includes(searchTerm)
                );
            });
        }

        this.currentPage = 1;
        this.renderTable();
    }

    // ========== SORTING ==========
    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            // Handle numeric sorting
            if (column === 'totalAmount') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }

            // Handle string sorting
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderTable();
        this.updateSortIndicators();
    }

    updateSortIndicators() {
        document.querySelectorAll('th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        const activeHeader = document.querySelector(`th[data-sort="${this.sortColumn}"] i`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;
        }
    }

    // ========== PAGINATION ==========
    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.recordsPerPage);
        const paginationContainer = document.getElementById('pagination');
        
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> ก่อนหน้า';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
        paginationContainer.appendChild(prevBtn);

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === this.currentPage ? 'active' : '';
            pageBtn.onclick = () => this.goToPage(i);
            paginationContainer.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = 'ถัดไป <i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
        paginationContainer.appendChild(nextBtn);
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.recordsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
        }
    }

    changeRecordsPerPage() {
        this.recordsPerPage = parseInt(document.getElementById('recordsPerPage').value);
        this.currentPage = 1;
        this.renderTable();
    }

    updateTableInfo() {
        const start = Math.min((this.currentPage - 1) * this.recordsPerPage + 1, this.filteredData.length);
        const end = Math.min(this.currentPage * this.recordsPerPage, this.filteredData.length);
        
        document.getElementById('showingStart').textContent = this.filteredData.length > 0 ? start : 0;
        document.getElementById('showingEnd').textContent = end;
        document.getElementById('totalRows').textContent = this.filteredData.length;
    }

    // ========== STATISTICS ==========
    updateStats() {
        const totalRecords = this.tableData.length;
        const totalAmount = this.tableData.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
        
        document.getElementById('totalRecords').textContent = totalRecords.toLocaleString('th-TH');
        document.getElementById('totalAmount').textContent = this.formatCurrency(totalAmount);
    }

    // ========== SELECT ALL FUNCTIONALITY ==========
    toggleSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.row-select');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    }

    getSelectedRows() {
        const selected = [];
        document.querySelectorAll('.row-select:checked').forEach(checkbox => {
            selected.push(parseInt(checkbox.dataset.index));
        });
        return selected;
    }

    // ========== SAMPLE DATA GENERATION ==========
    generateRandomData() {
        if (!confirm('ต้องการสร้างข้อมูลตัวอย่าง 5 รายการหรือไม่?')) return;

        const sampleData = [
            {
                custName: 'สมชาย ใจดี',
                memberLevel: 'Lv.3',
                memberCode: 'MEM001',
                phone: '0812345678',
                address: '123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ',
                plate: 'กข-1234',
                model: 'Toyota Vios',
                year: '2020',
                insuranceType: 'พรบ+สมัครใจ'
            },
            {
                custName: 'สมหญิง รักเรียน',
                memberLevel: 'Lv.1',
                phone: '0898765432',
                address: '456 ถนนลาดพร้าว เขตจตุจักร กรุงเทพฯ',
                plate: 'คง-5678',
                model: 'Honda City',
                year: '2019',
                insuranceType: 'สมัครใจ'
            },
            {
                custName: 'วิชัย มั่งมี',
                memberLevel: 'ไม่เป็นสมาชิก',
                phone: '0856789012',
                address: '789 ถนนรามคำแหง เขตมีนบุรี กรุงเทพฯ',
                plate: 'จฉ-9012',
                model: 'Mazda CX-5',
                year: '2021',
                insuranceType: 'พรบ'
            }
        ];

        sampleData.forEach(data => {
            // Set basic form data
            document.getElementById('custName').value = data.custName;
            document.getElementById('memberLevel').value = data.memberLevel;
            document.getElementById('memberCode').value = data.memberCode || '';
            document.getElementById('phone').value = data.phone;
            document.getElementById('address').value = data.address;
            document.getElementById('plate').value = data.plate;
            document.getElementById('model').value = data.model;
            document.getElementById('year').value = data.year;
            document.getElementById('insuranceType').value = data.insuranceType;

            // Set random premiums
            document.getElementById('premiumPRB').value = Math.floor(Math.random() * 500) + 500;
            document.getElementById('premiumVOL').value = Math.floor(Math.random() * 5000) + 2000;
            
            this.toggleMemberCode();
            this.togglePolicySub();
            this.addRecord();
        });

        this.showAlert('สร้างข้อมูลตัวอย่างเรียบร้อย 3 รายการ', 'success');
    }

    // ========== EXPORT FUNCTIONS ==========
    exportExcel() {
        if (!this.tableData.length) {
            this.showAlert('ไม่มีข้อมูลให้ส่งออก', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const exportData = this.tableData.map(record => ({
                'ชื่อลูกค้า': record.custName,
                'ระดับสมาชิก': record.memberLevel,
                'รหัสสมาชิก': record.memberCode,
                'เบอร์โทร': record.phone,
                'ที่อยู่': record.address,
                'ที่อยู่จัดส่งเอกสาร': record.docAddress,
                'ทะเบียนรถ': record.plate,
                'รุ่นรถ': record.model,
                'ปีรถ': record.year,
                'เลขเครื่องยนต์': record.engineNo,
                'VIN': record.vin,
                'ซีซี': record.cc,
                'จำนวนที่นั่ง': record.seat,
                'สีรถ': record.color,
                'อุปกรณ์ตกแต่ง': record.accessory,
                'ลักษณะการใช้งาน': record.useType,
                'ประเภทประกัน': record.insuranceType,
                'ประเภทสมัครใจ': record.policySubType,
                'บริษัทพรบ': record.companyPRB,
                'เบี้ยพรบ': record.premiumPRB,
                'ส่วนลดพรบ': record.discountPRB,
                'บริษัทสมัครใจ': record.companyVOL,
                'เบี้ยสมัครใจ': record.premiumVOL,
                'ส่วนลดสมัครใจ': record.discountVOL,
                'ยอดรวม': record.totalAmount,
                'พรบ เริ่ม': record.startPRB,
                'พรบ หมด': record.endPRB,
                'สมัครใจ เริ่ม': record.startVOL,
                'สมัครใจ หมด': record.endVOL,
                'การชำระเงิน': record.paymentType,
                'วันที่บันทึก': this.formatDate(record.timestamp)
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Set column widths
            const colWidths = [
                {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 30}, {wch: 30},
                {wch: 15}, {wch: 20}, {wch: 10}, {wch: 15}, {wch: 20}, {wch: 10},
                {wch: 10}, {wch: 10}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15},
                {wch: 20}, {wch: 12}, {wch: 12}, {wch: 20}, {wch: 12}, {wch: 12},
                {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15}
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลประกันรถยนต์");
            
            const fileName = `insurance_data_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            this.showAlert('ส่งออกข้อมูล Excel เรียบร้อย', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('เกิดข้อผิดพลาดในการส่งออกข้อมูล', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    exportCSV() {
        if (!this.tableData.length) {
            this.showAlert('ไม่มีข้อมูลให้ส่งออก', 'warning');
            return;
        }

        try {
            const headers = [
                'ชื่อลูกค้า', 'ระดับสมาชิก', 'รหัสสมาชิก', 'เบอร์โทร', 'ที่อยู่', 
                'ที่อยู่จัดส่งเอกสาร', 'ทะเบียนรถ', 'รุ่นรถ', 'ปีรถ', 'เลขเครื่องยนต์',
                'VIN', 'ซีซี', 'จำนวนที่นั่ง', 'สีรถ', 'อุปกรณ์ตกแต่ง', 'ลักษณะการใช้งาน',
                'ประเภทประกัน', 'ประเภทสมัครใจ', 'บริษัทพรบ', 'เบี้ยพรบ', 'ส่วนลดพรบ',
                'บริษัทสมัครใจ', 'เบี้ยสมัครใจ', 'ส่วนลดสมัครใจ', 'ยอดรวม', 'พรบ เริ่ม',
                'พรบ หมด', 'สมัครใจ เริ่ม', 'สมัครใจ หมด', 'การชำระเงิน', 'วันที่บันทึก'
            ];

            const csvContent = [
                headers.join(','),
                ...this.tableData.map(record => [
                    `"${record.custName}"`, `"${record.memberLevel}"`, `"${record.memberCode || ''}"`,
                    `"${record.phone}"`, `"${record.address || ''}"`, `"${record.docAddress}"`,
                    `"${record.plate}"`, `"${record.model}"`, record.year, `"${record.engineNo || ''}"`,
                    `"${record.vin || ''}"`, `"${record.cc || ''}"`, `"${record.seat || ''}"`,
                    `"${record.color || ''}"`, `"${record.accessory || ''}"`, `"${record.useType}"`,
                    `"${record.insuranceType}"`, `"${record.policySubType || ''}"`, `"${record.companyPRB || ''}"`,
                    record.premiumPRB, record.discountPRB, `"${record.companyVOL || ''}"`,
                    record.premiumVOL, record.discountVOL, record.totalAmount,
                    `"${record.startPRB || ''}"`, `"${record.endPRB || ''}"`, `"${record.startVOL || ''}"`,
                    `"${record.endVOL || ''}"`, `"${record.paymentType}"`, `"${this.formatDate(record.timestamp)}"`
                ].join(','))
            ].join('\n');

            // Add BOM for proper Thai character encoding
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `insurance_data_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            this.showAlert('ส่งออกข้อมูล CSV เรียบร้อย', 'success');
        } catch (error) {
            console.error('CSV Export error:', error);
            this.showAlert('เกิดข้อผิดพลาดในการส่งออกข้อมูล', 'error');
        }
    }

    // ========== IMPORT FUNCTIONS ==========
    importData() {
        document.getElementById('importFile').click();
        document.getElementById('importFile').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.showLoading(true);
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    let importedData = [];
                    
                    if (file.name.endsWith('.json')) {
                        importedData = JSON.parse(event.target.result);
                    } else {
                        // Excel or CSV
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                        
                        // Map imported columns to our format
                        importedData = this.mapImportedData(jsonData);
                    }

                    if (importedData.length > 0) {
                        if (confirm(`พบข้อมูล ${importedData.length} รายการ ต้องการนำเข้าหรือไม่?`)) {
                            this.tableData = [...this.tableData, ...importedData];
                            this.saveToStorage();
                            this.filteredData = [...this.tableData];
                            this.renderTable();
                            this.updateStats();
                            this.showAlert(`นำเข้าข้อมูลเรียบร้อย ${importedData.length} รายการ`, 'success');
                        }
                    } else {
                        this.showAlert('ไม่พบข้อมูลที่ถูกต้องในไฟล์', 'error');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    this.showAlert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 'error');
                } finally {
                    this.showLoading(false);
                }
            };
            
            if (file.name.endsWith('.json')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        };
    }

    mapImportedData(jsonData) {
        return jsonData.map(row => ({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            custName: row['ชื่อลูกค้า'] || '',
            memberLevel: row['ระดับสมาชิก'] || 'ไม่เป็นสมาชิก',
            memberCode: row['รหัสสมาชิก'] || '',
            phone: row['เบอร์โทร'] || '',
            address: row['ที่อยู่'] || '',
            docAddress: row['ที่อยู่จัดส่งเอกสาร'] || 'ตามบัตรประชาชน',
            plate: (row['ทะเบียนรถ'] || '').toUpperCase(),
            model: row['รุ่นรถ'] || '',
            year: row['ปีรถ'] || '',
            engineNo: row['เลขเครื่องยนต์'] || '',
            vin: row['VIN'] || '',
            cc: row['ซีซี'] || '',
            seat: row['จำนวนที่นั่ง'] || '',
            color: row['สีรถ'] || '',
            accessory: row['อุปกรณ์ตกแต่ง'] || '',
            useType: row['ลักษณะการใช้งาน'] || 'ใช้ส่วนบุคคล',
            insuranceType: row['ประเภทประกัน'] || '',
            policySubType: row['ประเภทสมัครใจ'] || '',
            companyPRB: row['บริษัทพรบ'] || '',
            premiumPRB: parseFloat(row['เบี้ยพรบ']) || 0,
            discountPRB: parseFloat(row['ส่วนลดพรบ']) || 0,
            companyVOL: row['บริษัทสมัครใจ'] || '',
            premiumVOL: parseFloat(row['เบี้ยสมัครใจ']) || 0,
            discountVOL: parseFloat(row['ส่วนลดสมัครใจ']) || 0,
            totalAmount: parseFloat(row['ยอดรวม']) || 0,
            startPRB: row['พรบ เริ่ม'] || '',
            endPRB: row['พรบ หมด'] || '',
            startVOL: row['สมัครใจ เริ่ม'] || '',
            endVOL: row['สมัครใจ หมด'] || '',
            paymentType: row['การชำระเงิน'] || 'เต็มจำนวน'
        }));
    }

    // ========== CLEAR ALL DATA ==========
    clearAllData() {
        if (confirm('ต้องการลบข้อมูลทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้')) {
            if (confirm('ยืนยันการลบข้อมูลทั้งหมดอีกครั้ง?')) {
                this.tableData = [];
                this.filteredData = [];
                this.saveToStorage();
                this.renderTable();
                this.updateStats();
                this.showAlert('ลบข้อมูลทั้งหมดเรียบร้อย', 'success');
            }
        }
    }

    // ========== PRINT FUNCTIONALITY ==========
    printTable() {
        window.print();
    }
}

// ========== GLOBAL FUNCTIONS ==========
// Keep global functions for onclick events
function toggleMemberCode() { app.toggleMemberCode(); }
function toggleDocAddress() { app.toggleDocAddress(); }
function toggleOtherUseType() { app.toggleOtherUseType(); }
function togglePolicySub() { app.togglePolicySub(); }
function togglePaymentPlan() { app.togglePaymentPlan(); }
function calcTotal() { app.calcTotal(); }
function addRecord() { app.addRecord(); }
function clearForm() { app.clearForm(); }
function generateRandomData() { app.generateRandomData(); }
function filterTable() { app.filterTable(); }
function changeRecordsPerPage() { app.changeRecordsPerPage(); }
function toggleSelectAll() { app.toggleSelectAll(); }
function exportExcel() { app.exportExcel(); }
function exportCSV() { app.exportCSV(); }
function importData() { app.importData(); }
function clearAllData() { app.clearAllData(); }
function printTable() { app.printTable(); }
function closeModal() { app.closeModal(); }

// ========== APPLICATION INITIALIZATION ==========
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new InsuranceApp();
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('detailModal');
        if (event.target === modal) {
            app.closeModal();
        }
    };
});

// Add custom styles for detail modal
const detailModalStyles = `
<style>
.record-detail {
    font-size: 0.95rem;
}

.detail-section {
    margin-bottom: 30px;
    padding: 20px;
    border-left: 4px solid var(--primary-color);
    background: #f8f9fa;
    border-radius: 0 8px 8px 0;
}

.detail-section h4 {
    color: var(--primary-color);
    font-size: 1.2rem;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
}

.detail-grid > div {
    padding: 8px 0;
    border-bottom: 1px dotted #dee2e6;
}

.total-row {
    grid-column: 1 / -1;
    background: white;
    padding: 15px;
    border-radius: 8px;
    border: 2px solid var(--primary-color);
    font-size: 1.1rem;
}

.total-amount {
    color: var(--primary-color);
    font-weight: bold;
    font-size: 1.2rem;
}

.badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
}

.badge-primary { background: var(--primary-color); color: white; }
.badge-success { background: var(--success-color); color: white; }
.badge-warning { background: var(--warning-color); color: #212529; }
.badge-secondary { background: var(--secondary-color); color: white; }

.action-buttons {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
}

@media (max-width: 768px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
    
    .action-buttons {
        flex-direction: column;
    }
    
    .action-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', detailModalStyles);