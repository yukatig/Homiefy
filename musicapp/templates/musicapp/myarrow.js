//TODO: Folgendes in das HTML Dokument einpflegen: <script src="myarrow.js"></script> und den tag mit in die custom tags aufnehmen

    const template = document.createElement('template'); 
    template.innerHTML = `
    <link rel="stylesheet" href="myarrowundefined-style.css">
    
    <label id="⇝"'>⇝</label>
    `;

    class Myarrowundefined extends HTMLElement {
        constructor() {
            super();
    
            this.attachShadow({mode: 'open'});
            this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    
    function(){
    window.alert("dummy-function. Please give me a good name and do something great here!");
    }

    connectedCallback() {
        this.shadowRoot.querySelector('#id-name').addEventListener('click',() => this.function());
    }

    disconnectedCallback() {
        this.shadowRoot.querySelector('#id-name').removeEventListener();
    }
}

customElements.define('myarrow', Myarrowundefined);