/**
 * 🚀 AdvancedComponents.js - FormEase Sprint 5 Phase 1
 * 
 * Composants UI avancés compatibles avec Tremor
 * Composants sophistiqués pour FormEase
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 1
 */

/**
 * Composant DataPicker avancé avec Tremor
 */
class DatePickerComponent extends BaseComponent {
    getDefaultProps() {
        return {
            value: '',
            placeholder: 'Sélectionner une date',
            format: 'DD/MM/YYYY',
            minDate: null,
            maxDate: null,
            disabled: false,
            clearable: true,
            showTime: false,
            locale: 'fr',
            onChange: () => {},
            onOpen: () => {},
            onClose: () => {}
        };
    }
    
    init() {
        this.state = {
            isOpen: false,
            selectedDate: this.props.value ? new Date(this.props.value) : null,
            currentMonth: new Date(),
            inputValue: this.formatDate(this.props.value)
        };
        
        this.calendar = null;
        this.setupDatePicker();
    }
    
    setupDatePicker() {
        // Configuration du calendrier
        this.calendarConfig = {
            months: [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ],
            days: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            today: new Date()
        };
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'relative w-full';
        container.id = this.id;
        
        // Input principal avec style Tremor
        const input = document.createElement('input');
        input.type = 'text';
        input.className = this.getInputClasses();
        input.placeholder = this.props.placeholder;
        input.value = this.state.inputValue;
        input.readOnly = true;
        input.disabled = this.props.disabled;
        
        // Icône calendrier
        const iconContainer = document.createElement('div');
        iconContainer.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1';
        
        // Bouton clear
        if (this.props.clearable && this.state.selectedDate) {
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'text-gray-400 hover:text-gray-600 p-1 rounded transition-colors';
            clearBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            `;
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearDate();
            });
            iconContainer.appendChild(clearBtn);
        }
        
        // Icône calendrier
        const calendarIcon = document.createElement('button');
        calendarIcon.type = 'button';
        calendarIcon.className = 'text-gray-400 hover:text-gray-600 p-1 rounded transition-colors';
        calendarIcon.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
        `;
        
        iconContainer.appendChild(calendarIcon);
        
        // Event listeners
        const toggleCalendar = () => {
            if (!this.props.disabled) {
                this.toggleCalendar();
            }
        };
        
        input.addEventListener('click', toggleCalendar);
        calendarIcon.addEventListener('click', toggleCalendar);
        
        container.appendChild(input);
        container.appendChild(iconContainer);
        
        // Calendrier popup
        if (this.state.isOpen) {
            const calendar = this.createCalendar();
            container.appendChild(calendar);
        }
        
        this.element = container;
        return container;
    }
    
    getInputClasses() {
        const baseClasses = [
            'w-full', 'px-3', 'py-2', 'pr-20',
            'text-sm', 'border', 'border-gray-300', 'rounded-lg',
            'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500',
            'transition-colors', 'duration-200', 'cursor-pointer',
            'bg-white', 'dark:bg-gray-800', 'dark:border-gray-600',
            'text-gray-900', 'dark:text-gray-100'
        ];
        
        if (this.props.disabled) {
            baseClasses.push('opacity-50', 'cursor-not-allowed');
        }
        
        return baseClasses.join(' ');
    }
    
    createCalendar() {
        const calendar = document.createElement('div');
        calendar.className = `
            absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg 
            z-50 w-80 animate-fade-in
        `;
        
        // Header avec navigation
        const header = this.createCalendarHeader();
        calendar.appendChild(header);
        
        // Grille des jours
        const grid = this.createCalendarGrid();
        calendar.appendChild(grid);
        
        // Footer avec actions
        if (this.props.showTime) {
            const timeSelector = this.createTimeSelector();
            calendar.appendChild(timeSelector);
        }
        
        const footer = this.createCalendarFooter();
        calendar.appendChild(footer);
        
        // Fermer au clic extérieur
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside.bind(this), { once: true });
        }, 0);
        
        return calendar;
    }
    
    createCalendarHeader() {
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-4';
        
        // Bouton mois précédent
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
        prevBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
        `;
        prevBtn.addEventListener('click', () => this.previousMonth());
        
        // Sélecteur de mois/année
        const monthYear = document.createElement('div');
        monthYear.className = 'text-lg font-semibold text-gray-900 dark:text-gray-100';
        monthYear.textContent = `${this.calendarConfig.months[this.state.currentMonth.getMonth()]} ${this.state.currentMonth.getFullYear()}`;
        
        // Bouton mois suivant
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
        nextBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        `;
        nextBtn.addEventListener('click', () => this.nextMonth());
        
        header.appendChild(prevBtn);
        header.appendChild(monthYear);
        header.appendChild(nextBtn);
        
        return header;
    }
    
    createCalendarGrid() {
        const grid = document.createElement('div');
        grid.className = 'space-y-2';
        
        // Header des jours
        const daysHeader = document.createElement('div');
        daysHeader.className = 'grid grid-cols-7 gap-1 mb-2';
        
        this.calendarConfig.days.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.className = 'text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2';
            dayCell.textContent = day;
            daysHeader.appendChild(dayCell);
        });
        
        grid.appendChild(daysHeader);
        
        // Grille des dates
        const datesGrid = document.createElement('div');
        datesGrid.className = 'grid grid-cols-7 gap-1';
        
        const firstDay = new Date(this.state.currentMonth.getFullYear(), this.state.currentMonth.getMonth(), 1);
        const lastDay = new Date(this.state.currentMonth.getFullYear(), this.state.currentMonth.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dateCell = this.createDateCell(date, firstDay.getMonth());
            datesGrid.appendChild(dateCell);
        }
        
        grid.appendChild(datesGrid);
        
        return grid;
    }
    
    createDateCell(date, currentMonth) {
        const cell = document.createElement('button');
        cell.type = 'button';
        
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = this.isSameDay(date, this.calendarConfig.today);
        const isSelected = this.state.selectedDate && this.isSameDay(date, this.state.selectedDate);
        const isDisabled = this.isDateDisabled(date);
        
        const classes = [
            'w-8', 'h-8', 'text-sm', 'rounded-lg', 'transition-colors',
            'hover:bg-blue-50', 'dark:hover:bg-blue-900/50'
        ];
        
        if (!isCurrentMonth) {
            classes.push('text-gray-300', 'dark:text-gray-600');
        } else if (isDisabled) {
            classes.push('text-gray-300', 'dark:text-gray-600', 'cursor-not-allowed');
        } else {
            classes.push('text-gray-700', 'dark:text-gray-300');
        }
        
        if (isToday) {
            classes.push('font-semibold', 'text-blue-600', 'dark:text-blue-400');
        }
        
        if (isSelected) {
            classes.push('bg-blue-500', 'text-white', 'hover:bg-blue-600');
        }
        
        cell.className = classes.join(' ');
        cell.textContent = date.getDate();
        
        if (!isDisabled) {
            cell.addEventListener('click', () => this.selectDate(date));
        }
        
        return cell;
    }
    
    createCalendarFooter() {
        const footer = document.createElement('div');
        footer.className = 'flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600';
        
        // Bouton Aujourd'hui
        const todayBtn = document.createElement('button');
        todayBtn.type = 'button';
        todayBtn.className = 'text-sm text-blue-500 hover:text-blue-600 font-medium';
        todayBtn.textContent = 'Aujourd\'hui';
        todayBtn.addEventListener('click', () => this.selectToday());
        
        // Boutons d'action
        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-2';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
        cancelBtn.textContent = 'Annuler';
        cancelBtn.addEventListener('click', () => this.closeCalendar());
        
        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors';
        confirmBtn.textContent = 'Confirmer';
        confirmBtn.addEventListener('click', () => this.confirmSelection());
        
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        
        footer.appendChild(todayBtn);
        footer.appendChild(actions);
        
        return footer;
    }
    
    // Méthodes utilitaires
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
    
    isDateDisabled(date) {
        if (this.props.minDate && date < new Date(this.props.minDate)) {
            return true;
        }
        if (this.props.maxDate && date > new Date(this.props.maxDate)) {
            return true;
        }
        return false;
    }
    
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
    
    // Actions
    toggleCalendar() {
        this.setState({ isOpen: !this.state.isOpen });
        
        if (this.state.isOpen) {
            this.props.onOpen();
        } else {
            this.props.onClose();
        }
    }
    
    closeCalendar() {
        this.setState({ isOpen: false });
        this.props.onClose();
    }
    
    selectDate(date) {
        this.setState({ selectedDate: date });
    }
    
    selectToday() {
        const today = new Date();
        this.setState({
            selectedDate: today,
            currentMonth: today
        });
    }
    
    confirmSelection() {
        if (this.state.selectedDate) {
            const formatted = this.formatDate(this.state.selectedDate);
            this.setState({ inputValue: formatted });
            this.props.onChange(this.state.selectedDate, formatted);
        }
        this.closeCalendar();
    }
    
    clearDate() {
        this.setState({
            selectedDate: null,
            inputValue: ''
        });
        this.props.onChange(null, '');
    }
    
    previousMonth() {
        const newMonth = new Date(this.state.currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        this.setState({ currentMonth: newMonth });
    }
    
    nextMonth() {
        const newMonth = new Date(this.state.currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        this.setState({ currentMonth: newMonth });
    }
    
    handleClickOutside(event) {
        if (!this.element.contains(event.target)) {
            this.closeCalendar();
        }
    }
}

/**
 * Composant Select/Dropdown avancé
 */
class SelectComponent extends BaseComponent {
    getDefaultProps() {
        return {
            options: [],
            value: '',
            placeholder: 'Sélectionner une option',
            searchable: false,
            clearable: false,
            disabled: false,
            multiple: false,
            maxHeight: '200px',
            onChange: () => {},
            onSearch: () => {}
        };
    }
    
    init() {
        this.state = {
            isOpen: false,
            searchTerm: '',
            selectedOptions: this.props.multiple ? (Array.isArray(this.props.value) ? this.props.value : []) : [this.props.value],
            filteredOptions: this.props.options
        };
        
        this.setupSelect();
    }
    
    setupSelect() {
        this.filterOptions();
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'relative w-full';
        container.id = this.id;
        
        // Trigger button
        const trigger = this.createTrigger();
        container.appendChild(trigger);
        
        // Dropdown menu
        if (this.state.isOpen) {
            const dropdown = this.createDropdown();
            container.appendChild(dropdown);
        }
        
        this.element = container;
        return container;
    }
    
    createTrigger() {
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = this.getTriggerClasses();
        trigger.disabled = this.props.disabled;
        
        // Contenu du trigger
        const content = document.createElement('div');
        content.className = 'flex items-center justify-between w-full';
        
        // Texte sélectionné
        const selectedText = document.createElement('span');
        selectedText.className = 'flex-1 text-left truncate';
        
        const displayText = this.getDisplayText();
        if (displayText) {
            selectedText.textContent = displayText;
            selectedText.className += ' text-gray-900 dark:text-gray-100';
        } else {
            selectedText.textContent = this.props.placeholder;
            selectedText.className += ' text-gray-400';
        }
        
        // Icône
        const icon = document.createElement('span');
        icon.className = `ml-2 text-gray-400 transition-transform duration-200 ${this.state.isOpen ? 'rotate-180' : ''}`;
        icon.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        `;
        
        content.appendChild(selectedText);
        content.appendChild(icon);
        trigger.appendChild(content);
        
        trigger.addEventListener('click', () => this.toggleDropdown());
        
        return trigger;
    }
    
    createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = `
            absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg 
            z-50 overflow-hidden animate-fade-in
        `;
        dropdown.style.maxHeight = this.props.maxHeight;
        
        // Search input
        if (this.props.searchable) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'p-2 border-b border-gray-200 dark:border-gray-600';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = `
                w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            `;
            searchInput.placeholder = 'Rechercher...';
            searchInput.value = this.state.searchTerm;
            
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchContainer.appendChild(searchInput);
            dropdown.appendChild(searchContainer);
        }
        
        // Options list
        const optionsList = document.createElement('div');
        optionsList.className = 'max-h-48 overflow-y-auto';
        
        if (this.state.filteredOptions.length === 0) {
            const noOptions = document.createElement('div');
            noOptions.className = 'p-3 text-sm text-gray-500 dark:text-gray-400 text-center';
            noOptions.textContent = 'Aucune option trouvée';
            optionsList.appendChild(noOptions);
        } else {
            this.state.filteredOptions.forEach(option => {
                const optionElement = this.createOption(option);
                optionsList.appendChild(optionElement);
            });
        }
        
        dropdown.appendChild(optionsList);
        
        // Clear button
        if (this.props.clearable && this.hasSelection()) {
            const clearContainer = document.createElement('div');
            clearContainer.className = 'p-2 border-t border-gray-200 dark:border-gray-600';
            
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors';
            clearBtn.textContent = 'Effacer la sélection';
            clearBtn.addEventListener('click', () => this.clearSelection());
            
            clearContainer.appendChild(clearBtn);
            dropdown.appendChild(clearContainer);
        }
        
        // Fermer au clic extérieur
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside.bind(this), { once: true });
        }, 0);
        
        return dropdown;
    }
    
    createOption(option) {
        const optionElement = document.createElement('button');
        optionElement.type = 'button';
        optionElement.className = this.getOptionClasses(option);
        
        const content = document.createElement('div');
        content.className = 'flex items-center justify-between w-full';
        
        const text = document.createElement('span');
        text.textContent = option.label || option;
        
        content.appendChild(text);
        
        // Checkmark pour les options sélectionnées
        if (this.isOptionSelected(option)) {
            const checkmark = document.createElement('span');
            checkmark.className = 'text-blue-500';
            checkmark.innerHTML = `
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
            `;
            content.appendChild(checkmark);
        }
        
        optionElement.appendChild(content);
        
        optionElement.addEventListener('click', () => this.selectOption(option));
        
        return optionElement;
    }
    
    // Méthodes utilitaires et actions
    getTriggerClasses() {
        const classes = [
            'w-full', 'px-3', 'py-2', 'text-left', 'text-sm',
            'border', 'border-gray-300', 'dark:border-gray-600',
            'rounded-lg', 'bg-white', 'dark:bg-gray-800',
            'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500',
            'transition-colors', 'duration-200'
        ];
        
        if (this.props.disabled) {
            classes.push('opacity-50', 'cursor-not-allowed');
        }
        
        return classes.join(' ');
    }
    
    getOptionClasses(option) {
        const classes = [
            'w-full', 'px-3', 'py-2', 'text-left', 'text-sm',
            'hover:bg-gray-100', 'dark:hover:bg-gray-700',
            'transition-colors', 'duration-200'
        ];
        
        if (this.isOptionSelected(option)) {
            classes.push('bg-blue-50', 'dark:bg-blue-900/50', 'text-blue-700', 'dark:text-blue-300');
        } else {
            classes.push('text-gray-900', 'dark:text-gray-100');
        }
        
        return classes.join(' ');
    }
    
    getDisplayText() {
        if (this.props.multiple) {
            const selectedCount = this.state.selectedOptions.filter(Boolean).length;
            if (selectedCount === 0) return '';
            if (selectedCount === 1) {
                const option = this.props.options.find(opt => 
                    (opt.value || opt) === this.state.selectedOptions[0]
                );
                return option ? (option.label || option) : '';
            }
            return `${selectedCount} éléments sélectionnés`;
        } else {
            const selected = this.state.selectedOptions[0];
            if (!selected) return '';
            const option = this.props.options.find(opt => 
                (opt.value || opt) === selected
            );
            return option ? (option.label || option) : '';
        }
    }
    
    isOptionSelected(option) {
        const value = option.value || option;
        return this.state.selectedOptions.includes(value);
    }
    
    hasSelection() {
        return this.state.selectedOptions.some(Boolean);
    }
    
    filterOptions() {
        if (!this.state.searchTerm) {
            this.setState({ filteredOptions: this.props.options });
            return;
        }
        
        const filtered = this.props.options.filter(option => {
            const text = (option.label || option).toLowerCase();
            return text.includes(this.state.searchTerm.toLowerCase());
        });
        
        this.setState({ filteredOptions: filtered });
    }
    
    toggleDropdown() {
        if (!this.props.disabled) {
            this.setState({ isOpen: !this.state.isOpen });
        }
    }
    
    selectOption(option) {
        const value = option.value || option;
        
        if (this.props.multiple) {
            let newSelection = [...this.state.selectedOptions];
            const index = newSelection.indexOf(value);
            
            if (index > -1) {
                newSelection.splice(index, 1);
            } else {
                newSelection.push(value);
            }
            
            this.setState({ selectedOptions: newSelection });
            this.props.onChange(newSelection);
        } else {
            this.setState({ 
                selectedOptions: [value],
                isOpen: false
            });
            this.props.onChange(value);
        }
    }
    
    clearSelection() {
        this.setState({ 
            selectedOptions: this.props.multiple ? [] : [''],
            isOpen: false
        });
        this.props.onChange(this.props.multiple ? [] : '');
    }
    
    handleSearch(term) {
        this.setState({ searchTerm: term });
        this.filterOptions();
        this.props.onSearch(term);
    }
    
    handleClickOutside(event) {
        if (!this.element.contains(event.target)) {
            this.setState({ isOpen: false });
        }
    }
}

/**
 * Composant FileUpload avec drag & drop
 */
class FileUploadComponent extends BaseComponent {
    getDefaultProps() {
        return {
            multiple: false,
            accept: '*/*',
            maxSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            dragAndDrop: true,
            showPreview: true,
            uploadOnSelect: false,
            uploadUrl: null,
            onSelect: () => {},
            onUpload: () => {},
            onError: () => {},
            onProgress: () => {}
        };
    }
    
    init() {
        this.state = {
            files: [],
            uploading: false,
            dragActive: false,
            previews: new Map()
        };
        
        this.setupFileUpload();
    }
    
    setupFileUpload() {
        this.fileTypes = {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        };
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'w-full space-y-4';
        container.id = this.id;
        
        // Zone de drop
        const dropzone = this.createDropzone();
        container.appendChild(dropzone);
        
        // Liste des fichiers
        if (this.state.files.length > 0) {
            const fileList = this.createFileList();
            container.appendChild(fileList);
        }
        
        // Input hidden
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = this.props.multiple;
        input.accept = this.props.accept;
        input.className = 'hidden';
        input.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        
        container.appendChild(input);
        
        this.element = container;
        this.fileInput = input;
        
        return container;
    }
    
    createDropzone() {
        const dropzone = document.createElement('div');
        dropzone.className = this.getDropzoneClasses();
        
        // Contenu de la dropzone
        const content = document.createElement('div');
        content.className = 'text-center space-y-4';
        
        // Icône
        const icon = document.createElement('div');
        icon.className = 'mx-auto w-12 h-12 text-gray-400';
        icon.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
        `;
        
        // Texte principal
        const title = document.createElement('div');
        title.className = 'text-lg font-medium text-gray-900 dark:text-gray-100';
        title.textContent = 'Déposer vos fichiers ici';
        
        // Texte secondaire
        const subtitle = document.createElement('div');
        subtitle.className = 'text-sm text-gray-500 dark:text-gray-400';
        subtitle.innerHTML = `
            ou <button type="button" class="text-blue-500 hover:text-blue-600 font-medium">parcourir</button>
        `;
        
        // Info sur les fichiers
        const info = document.createElement('div');
        info.className = 'text-xs text-gray-400';
        info.textContent = this.getFileInfo();
        
        content.appendChild(icon);
        content.appendChild(title);
        content.appendChild(subtitle);
        content.appendChild(info);
        
        dropzone.appendChild(content);
        
        // Event listeners
        dropzone.addEventListener('click', () => this.fileInput.click());
        
        const browseBtn = subtitle.querySelector('button');
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        
        if (this.props.dragAndDrop) {
            this.setupDragAndDrop(dropzone);
        }
        
        return dropzone;
    }
    
    createFileList() {
        const container = document.createElement('div');
        container.className = 'space-y-2';
        
        const title = document.createElement('h4');
        title.className = 'text-sm font-medium text-gray-900 dark:text-gray-100 mb-3';
        title.textContent = `Fichiers sélectionnés (${this.state.files.length})`;
        
        container.appendChild(title);
        
        this.state.files.forEach((file, index) => {
            const fileItem = this.createFileItem(file, index);
            container.appendChild(fileItem);
        });
        
        return container;
    }
    
    createFileItem(file, index) {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600';
        
        // Icône de fichier
        const iconContainer = document.createElement('div');
        iconContainer.className = 'flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center';
        
        if (this.props.showPreview && this.isImageFile(file)) {
            const preview = this.state.previews.get(file.name);
            if (preview) {
                const img = document.createElement('img');
                img.src = preview;
                img.className = 'w-full h-full object-cover';
                iconContainer.appendChild(img);
            }
        } else {
            const icon = document.createElement('div');
            icon.className = 'text-gray-400 w-6 h-6';
            icon.innerHTML = this.getFileIcon(file);
            iconContainer.appendChild(icon);
        }
        
        // Info fichier
        const info = document.createElement('div');
        info.className = 'flex-1 min-w-0';
        
        const name = document.createElement('div');
        name.className = 'text-sm font-medium text-gray-900 dark:text-gray-100 truncate';
        name.textContent = file.name;
        
        const details = document.createElement('div');
        details.className = 'text-xs text-gray-500 dark:text-gray-400';
        details.textContent = `${this.formatFileSize(file.size)} • ${file.type}`;
        
        info.appendChild(name);
        info.appendChild(details);
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-2';
        
        // Bouton supprimer
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'p-1 text-gray-400 hover:text-red-500 rounded transition-colors';
        removeBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        `;
        removeBtn.addEventListener('click', () => this.removeFile(index));
        
        actions.appendChild(removeBtn);
        
        item.appendChild(iconContainer);
        item.appendChild(info);
        item.appendChild(actions);
        
        return item;
    }
    
    // Méthodes utilitaires
    getDropzoneClasses() {
        const classes = [
            'relative', 'border-2', 'border-dashed', 'rounded-lg', 'p-8',
            'transition-colors', 'duration-200', 'cursor-pointer'
        ];
        
        if (this.state.dragActive) {
            classes.push('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        } else {
            classes.push('border-gray-300', 'dark:border-gray-600', 'hover:border-blue-400', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
        }
        
        return classes.join(' ');
    }
    
    getFileInfo() {
        const maxSize = this.formatFileSize(this.props.maxSize);
        const formats = this.props.accept === '*/*' ? 'Tous formats' : this.props.accept;
        return `Taille max: ${maxSize} • ${formats}`;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    isImageFile(file) {
        return this.fileTypes.image.includes(file.type);
    }
    
    getFileIcon(file) {
        if (this.fileTypes.image.includes(file.type)) {
            return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
        }
        
        if (this.fileTypes.document.includes(file.type)) {
            return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
        }
        
        return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    }
    
    // Actions
    setupDragAndDrop(dropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => this.setState({ dragActive: true }), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => this.setState({ dragActive: false }), false);
        });
        
        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelect(files);
        }, false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleFileSelect(fileList) {
        const files = Array.from(fileList);
        const validFiles = [];
        
        files.forEach(file => {
            // Validation taille
            if (file.size > this.props.maxSize) {
                this.props.onError(`Le fichier ${file.name} est trop volumineux`);
                return;
            }
            
            // Validation type
            if (this.props.accept !== '*/*' && !this.props.accept.split(',').some(type => file.type.match(type.trim()))) {
                this.props.onError(`Le type de fichier ${file.name} n'est pas autorisé`);
                return;
            }
            
            validFiles.push(file);
        });
        
        // Limite nombre de fichiers
        const currentCount = this.state.files.length;
        const newCount = currentCount + validFiles.length;
        
        if (newCount > this.props.maxFiles) {
            this.props.onError(`Nombre maximum de fichiers dépassé (${this.props.maxFiles})`);
            return;
        }
        
        // Ajouter les fichiers
        const newFiles = this.props.multiple ? [...this.state.files, ...validFiles] : validFiles;
        this.setState({ files: newFiles });
        
        // Générer les previews pour les images
        if (this.props.showPreview) {
            this.generatePreviews(validFiles);
        }
        
        this.props.onSelect(newFiles);
        
        // Upload automatique si configuré
        if (this.props.uploadOnSelect && this.props.uploadUrl) {
            this.uploadFiles(validFiles);
        }
    }
    
    generatePreviews(files) {
        files.forEach(file => {
            if (this.isImageFile(file)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newPreviews = new Map(this.state.previews);
                    newPreviews.set(file.name, e.target.result);
                    this.setState({ previews: newPreviews });
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    removeFile(index) {
        const newFiles = [...this.state.files];
        const removedFile = newFiles.splice(index, 1)[0];
        
        // Supprimer le preview
        const newPreviews = new Map(this.state.previews);
        newPreviews.delete(removedFile.name);
        
        this.setState({ 
            files: newFiles,
            previews: newPreviews
        });
    }
    
    async uploadFiles(files) {
        if (!this.props.uploadUrl) {
            this.props.onError('URL d\'upload non configurée');
            return;
        }
        
        this.setState({ uploading: true });
        
        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch(this.props.uploadUrl, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.props.onUpload(file, result);
                } else {
                    throw new Error(`Erreur upload: ${response.statusText}`);
                }
            } catch (error) {
                this.props.onError(`Erreur upload ${file.name}: ${error.message}`);
            }
        }
        
        this.setState({ uploading: false });
    }
}

// Export des composants avancés
window.DatePickerComponent = DatePickerComponent;
window.SelectComponent = SelectComponent;
window.FileUploadComponent = FileUploadComponent;

console.log('🚀 Composants avancés Tremor/Tailwind chargés');
