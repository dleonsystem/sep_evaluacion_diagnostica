Module Module1
    Public db As ADODB.Connection
    Public dbg As ADODB.Connection
    Public dbxl As ADODB.Connection


    Public rs As ADODB.Recordset
    Public rt As ADODB.Recordset
    Public rx As ADODB.Recordset
    Public rv As ADODB.Recordset
    Public rh As ADODB.Recordset
    Public rz As ADODB.Recordset
    Public rsxl As ADODB.Recordset

    Public valor_move As Boolean
    Public moux As Integer
    Public mouy As Integer
    Public datos(10) As String
    Public ubicreporte As String = "C:\SiCRER.25_26.SEPT\REPORTES\"

    Public Desc_Campo(3) As String

    Public torden As Integer

    Public ruta As String = "C:\SiCRER.25_26.SEPT\"
    Public ruta2 As String = "C:\RECIBE_SiCRER.25_26.SEPT\"

    'Public carchivo As Integer 'Esta variable se utiliza para contar cada archivo creado en pdf
End Module
