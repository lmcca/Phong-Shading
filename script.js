// Criação do objeto Three.js que armazenará os dados da cena.
let scene = new THREE.Scene();

// Definição da câmera do Three.js
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 25;

// A câmera é adicionada a cena.
scene.add(camera);

// Criação do objeto Three.js responsável por realizar o rendering.
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Criação do objeto de controle (interação) da câmera.
let controls = new THREE.OrbitControls(camera, renderer.domElement);

//----------------------------------------------------------------------------
// 'geometry' : Variável que contém a geometria (informação sobre vértices
//     e arestas) do objeto a ser renderizado (um torus, neste caso). É importante 
//     observar que, de acordo com o Three.js, a geometria de um objeto não contém
//     ainda a informação sobre o seu material.
//----------------------------------------------------------------------------
let geometry = new THREE.TorusGeometry(10, 3, 16, 25);

//----------------------------------------------------------------------------
// Variáveis do tipo "uniform", enviadas pela CPU aos shaders :
//
// * 'Ia' : intensidade (i.e cor) da luz ambiente.
// * 'Ip_position' : posição da fonte de luz pontual no Espaço do Universo.
// * 'Ip_diffuse_color' : intensidade (i.e cor) do componente difuso da fonte de luz pontual.
// * 'k_a' : coeficiente de reflectância ambiente do objeto.
// * 'k_d' : coeficiente de reflectância difusa do objeto.
// * 'k_s' : coeficiente de reflectância especular do objeto.
//----------------------------------------------------------------------------


let rendering_uniforms = {
  Ia: { type: 'vec3', value: new THREE.Color(0.3, 0.3, 0.3) },
  Ip_position: { type: 'vec3', value: new THREE.Vector3(-20, 10, 10) },
  Ip_diffuse_color: { type: 'vec3', value: new THREE.Color(0.7, 0.7, 0.7) },
  k_a: { type: 'vec3', value: new THREE.Color(0.25, 0.25, 0.85) },
  k_d: { type: 'vec3', value: new THREE.Color(0.25, 0.25, 0.85) },
  k_s: { type: 'vec3', value: new THREE.Color(1, 1, 1) }
}

//----------------------------------------------------------------------------
// Criação do material na forma de um Vertex Shader e um Fragment Shader customizados.
// Os shaders receberão valores da CPU (i.e. variáveis do tipo 'uniform') por meio da
// variável 'rendering_uniforms'.
//----------------------------------------------------------------------------
let material = new THREE.ShaderMaterial({
  uniforms: rendering_uniforms,
  vertexShader: '',
  fragmentShader: ''
});

//----------------------------------------------------------------------------
// Vertex Shader
//----------------------------------------------------------------------------
material.vertexShader = `
    

    // 'uniform' contendo informação sobre a fonte de luz ambiente.
    
    uniform vec3 Ia;
    
    // 'uniforms' contendo informações sobre a fonte de luz pontual.
    
    uniform vec3 Ip_position;
    uniform vec3 Ip_diffuse_color;

    // 'uniforms' contendo informações sobre as reflectâncias do objeto.
    
    uniform vec3 k_a;
    uniform vec3 k_d;
    uniform vec3 k_s;

    // 'I' : Variável que armazenará a cor final (i.e. intensidade) do vértice, após a avaliação do modelo local de iluminação.
    //     A variável 'I' é do tipo 'varying', ou seja, seu valor será calculado pelo Vertex Shader (por vértice)
    //     e será interpolado durante a rasterização das primitivas, ficando disponível para cada fragmento gerado pela rasterização.
    
    varying vec4 I;

    varying vec3 vertPos;

    varying vec3 normalInterp;

    varying vec3 N_cam_spc;

    varying vec3 L_cam_spc;

    varying vec3 R_cam_spc;

    varying vec3 V_cam_spc;

    // Programa principal do Vertex Shader.
     
    void main() {

          // 'modelViewMatrix' : variável de sistema que contém a matriz ModelView (4x4).
          // 'Ip_pos_cam_spc' : variável que armazenará a posição da fonte de luz no Espaço da Câmera.
        
        vec4 Ip_pos_cam_spc = modelViewMatrix * vec4(Ip_position, 1.0);

        // 'position' : variável de sistema que contém a posição do vértice (vec3) no espaço do objeto.
        // 'P_cam_spc' : variável que contém o vértice (i.e. 'position') transformado para o Espaço de Câmera.
        //     Observe que 'position' é um vetor 3D que precisou ser levado para o espaço projetivo 4D 
        //     (i.e., acrescentando-se uma coordenada adicional w = 1.0) para poder ser multiplicado pela
        //     matriz 'modelViewMatrix' (que é 4x4).
        
        vec4 P_cam_spc = modelViewMatrix * vec4(position, 1.0);

        vec3 vertPos = vec3(P_cam_spc)/P_cam_spc.w;

        // 'normal' : variável de sistema que contém o vetor normal do vértice (vec3) no espaço do objeto.
        // 'normalMatrix' : variável de sistema que contém a matriz de normais (3x3) gerada a partir da matriz 'modelViewMatrix'.
        
        N_cam_spc = normalize(normalMatrix * normal);


        // 'normalize()' : função do sistema que retorna o vetor de entrada normalizado (i.e. com comprimento = 1).
        // 'L_cam_spc' : variável que contém o vetor unitário, no Espaço de Câmera, referente à fonte de luz.
        
        L_cam_spc = normalize(Ip_pos_cam_spc.xyz - P_cam_spc.xyz); 

        R_cam_spc = reflect(-L_cam_spc, N_cam_spc);

        V_cam_spc = normalize(-vertPos);


        ///////////////////////////////////////////////////////////////////////////////
        //
        /*  

        //implementação do modelo phong utilizando interpolação Gouraud
        

        float lambertian = max(dot(N_cam_spc, L_cam_spc), 0.0);

        float specular = 0.0;

        float n = 30.0;

         if(lambertian > 0.0) {
           
           float specAngle = max(dot(R_cam_spc, V_cam_spc), 0.0);
           specular = pow(specAngle,n);
           }
           
           I = vec4(k_a*Ia+k_d*lambertian*Ip_diffuse_color+k_s*Ip_diffuse_color*specular,1.0); 
            
        */  



      
         
        //
        ///////////////////////////////////////////////////////////////////////////////

        // 'I' : cor final (i.e. intensidade) do vértice.
        //     Neste caso, a cor retornada é vermelho. Para a realização do exercício, o aluno deverá atribuir a 'I' o valor
        //     final gerado pelo modelo local de iluminação implementado.
        
        I = vec4(1.0,0.5,0.3,1.0); 

        // 'gl_Position' : variável de sistema que conterá a posição final do vértice transformado pelo Vertex Shader.
        
        gl_Position = projectionMatrix * P_cam_spc;
    }
    `;

//----------------------------------------------------------------------------
// Fragment Shader
//----------------------------------------------------------------------------
material.fragmentShader = `
    // 'I' : valor de cor originalmente calculada pelo Vertex Shader, e já interpolada para o fragmento corrente.

    uniform vec3 Ia;

    uniform vec3 k_a;

    uniform vec3 k_d;

    uniform vec3 k_s;

    uniform vec3 Ip_position;
    uniform vec3 Ip_diffuse_color;
    varying vec4 I;

    varying vec3 vertPos;

    varying vec3 N_cam_spc;

    varying vec3 L_cam_spc;

    varying vec3 R_cam_spc;

    varying vec3 V_cam_spc;

  
    // Programa principal do Fragment Shader.

    void main() {

   
        vec3 N_cam_spc_f=normalize(N_cam_spc);

        vec3 L_cam_spc_f=normalize(L_cam_spc);
      
        float lambertian = max(dot(N_cam_spc_f, L_cam_spc_f), 0.0);


         float specular = 0.0;

          float n = 16.0;

         if(lambertian > 0.0) {
           
           float specAngle = max(dot(R_cam_spc, V_cam_spc), 0.0);
           specular = pow(specAngle,n);
           }
           

         vec3 ambient=k_a * Ia;

         vec3 difuso=k_d*Ip_diffuse_color*lambertian;

         vec3 especular=k_s*Ip_diffuse_color*specular;

   
          gl_FragColor = vec4(ambient+difuso+especular, 1.0);
        
     }
        
    
    `;

//----------------------------------------------------------------------------
// 'object_mesh' : De acordo com o Three.js, um 'mesh' é a geometria acrescida do material.
//----------------------------------------------------------------------------
var object_mesh = new THREE.Mesh(geometry, material);
scene.add(object_mesh);

//----------------------------------------------------------------------------
// 'render()' : Função que realiza o rendering da cena a cada frame.
//----------------------------------------------------------------------------
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

// Chamada da função de rendering.
render();
