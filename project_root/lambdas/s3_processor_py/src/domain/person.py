class Person:
    def __init__(self, documento: str, nombre: str, apellido: str = '', tipo_documento: str = '', correo: str = ''):
        if not documento or not nombre:
            raise ValueError("Documento y nombre son obligatorios")
        self.documento = documento
        self.nombre = nombre
        self.apellido = apellido
        self.tipo_documento = tipo_documento
        self.correo = correo
