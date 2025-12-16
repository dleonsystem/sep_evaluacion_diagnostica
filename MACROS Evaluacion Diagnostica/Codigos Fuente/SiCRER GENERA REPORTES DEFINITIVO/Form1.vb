Imports System.IO
Imports Microsoft.Win32
Imports CrystalDecisions.CrystalReports.Engine
Imports CrystalDecisions.Shared
Imports System.Data.OleDb
'LIBRERÍAS INCLUIDAS EN EL SISTEMA
Public Class Form1
    Dim Cgrupos() As String
    Dim Cgruposb() As String

    Dim Cgrados() As String
    Dim Cfases() As String
    Dim Cescuelas() As String
    Dim Cturnos() As String
    Dim unicos() As Integer


    Dim Cgrup As String

    Dim carpetacct As String
    Dim regresa_turno As String
    Dim cnt As Integer
    Dim vf As Integer

    Dim r_turno As String
    Dim t As Integer
    Dim tt As Integer

    Dim tipo_rep As String

    Dim finr As Integer
    Dim rn As Integer

    Dim nvlstr As String

    Dim sqlsentencia As String



    Dim ent As String

    'DECLARACIÓN DE MATRICES Y VARIABLES QUE SERÁN UTILIZADOS EN EL SISTEMA



    Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load

        valor_move = False


        db = New ADODB.Connection
        db.Open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & ruta & "bd25.26.1.mdb" & ";Jet OLEDB:Database Password=$1cR3r25_26$3pt;")

        db.Execute("DELETE * FROM ALUMNOS")
        db.Execute("DELETE * FROM GRAFICAS")
        db.Execute("DELETE * FROM GRAFICAS2")

        Label5.Visible = True


        'CONEXIÓN CON LA BASE DE DATOS EN ACCESS, ESTA BASE DE DATOS ALOJARÁ LOS REGISTROS QUE ENVIÉN LOS PROFESORES EN SUS ARCHIVOS DE EXCEL

    End Sub





    Private Sub PictureBox16_MouseMove(sender As Object, e As MouseEventArgs) Handles PictureBox16.MouseMove



        If valor_move = True Then
            Me.Top = Cursor.Position.Y - mouy
            Me.Left = Cursor.Position.X - moux
        End If
        'RUTINA PARA QUE EL USUARIO MUEVA EL FORM A DONDE DESEE DESDE EL BANNER SUPERIOR
    End Sub

    Private Sub PictureBox16_MouseUp(sender As Object, e As MouseEventArgs) Handles PictureBox16.MouseUp
        valor_move = False 'COMPLEMENTO PARA RUTINA PARA QUE EL USUARIO MUEVA EL FORM A DONDE DESEE DESDE EL BANNER SUPERIOR
    End Sub



    Private Sub PictureBox16_MouseDown(sender As Object, e As MouseEventArgs) Handles PictureBox16.MouseDown
        valor_move = True
        moux = Cursor.Position.X - Me.Left
        mouy = Cursor.Position.Y - Me.Top
        'RUTINA PARA QUE EL USUARIO MUEVA EL FORM A DONDE DESEE DESDE EL BANNER SUPERIOR
    End Sub


    Public Function ExportToPDF(rpt As ReportDocument, NombreArchivo As String) As String

        Dim vFileName As String = Nothing
        Dim diskOpts As New DiskFileDestinationOptions()

        Try
            rpt.ExportOptions.ExportDestinationType = ExportDestinationType.DiskFile
            rpt.ExportOptions.ExportFormatType = ExportFormatType.PortableDocFormat

            'Este es la ruta donde se guardara tu archivo.
            vFileName = "C:\RECIBE_SiCRER.25_26.SEPT\" & carpetacct & "\" & NombreArchivo

            If File.Exists(vFileName) Then
                File.Delete(vFileName)
            End If
            diskOpts.DiskFileName = vFileName
            rpt.ExportOptions.DestinationOptions = diskOpts
            rpt.Export()
            rpt.Close()
            rpt = Nothing
            ' carchivo = carchivo + 1

            'CIERRA Y BORRA EL OBJETO QUE MANEJA EL REPORTE PARA NO ACUMULAR MEMORIA INECESARIA

        Catch ex As Exception
            MsgBox(Err.Description)
            Throw ex
            'SI EXISTE ALGÚN ERROR SE MOSTRARÁ EN UN MENSAJE LA DESCRIPCIÓN DEL ERROR
        End Try

        Return vFileName
        'ESTA FUNCIÓN SE UTILIZA PARA PODER EXPORTAR UN REPORTE A UN ARCHIVO EN PDF
    End Function
    Sub Imprime_todo()
        Me.DoubleBuffered = True 'ESTA INSTRUCCIÓN HABILITA EL DOBLE BUFFER EN ESTE PROCEDIMIENTO PARA GENERAR EL PROCEDIMIENTO MÁS EFICAZMENTE
        Erase Cescuelas
        Erase Cturnos
        Erase Cfases
        Erase Cgrados
        Erase Cgrupos
        Erase unicos


        Dim xe As Integer 'VARIABLE PARA CONTEO

        vf = 0
        cnt = 0
        'carchivo = 0

        'SE BORRAN LAS MATRICES Y LAS VARIABLES VF Y CNT SE ESTABLECEN EN 0 PARA POSTERIORMENTE SER UTILIZADAS EN CONTEOS


        Guna2CircleProgressBar1.Visible = True
        PictureBox15.Visible = True
        'APARECE EL GUNA2CIRCLEPROGRESSBAR1 Y EL PICTUREBOX15, LOS CUÁLES INDICAN QUE EL PROCEDIMIENTO HÁ EMPEZADO






        Label1.Visible = True
        Label2.Visible = True
        'SE MUESTRAN ETIQUETAS PARA EL CONTROL DE CUANTOS CCT - TURNO SE HAN PROCESADO
        xe = 0

        rn = 0
        finr = 0

        rt = Nothing
        rt = New ADODB.Recordset
        rt.Open("Select distinct id,cct,turno From alumnos order by cct asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rt.MoveFirst()
        rt.MoveLast()


        finr = rt.RecordCount
        'SE ASIGNA A LA VARIABLE FINR EL TOTAL DE CCT - TURNOS


        Label1.Text = "1 DE " & finr
        'LA ETIQUETA VA MOSTRANDO EL CONTROL DE LOS CCT - TURNO PROCESADOS

        ' rt = Nothing
        ' rt = New ADODB.Recordset
        ' rt.Open("Select distinct unico,cct From alumnos order by cct asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        ' rt.MoveFirst()
        ' rt.MoveLast()

        ' ReDim Preserve Cescuelas(rt.RecordCount - 1)

        ' rt.MoveFirst()
        ' Do While Not rt.EOF
        'Cescuelas(xe) = rt.Fields("CCT").Value

        'xe = xe + 1
        'rt.MoveNext()
        'Loop
        ' cnt = rt.RecordCount


        'xe = 0
        'rt.Close()
        'rt = Nothing

        'SE ALMACENAN TODOS LOS CCT EN LA MATRIZ Cescuelas

        On Error GoTo CERRORES 'EN CASO DE ALGÚN ERORR OPERATIVO NOS ENVIARÁ A LA RUTINA DEL CONTROL DE ERRORES - CERRORES



        rt = Nothing
        rt = New ADODB.Recordset
        rt.Open("Select distinct(ID) From alumnos order by ID asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rt.MoveFirst()
        rt.MoveLast()

        ReDim Preserve unicos(rt.RecordCount - 1)

        rt.MoveFirst()
        Do While Not rt.EOF
            unicos(xe) = rt.Fields("ID").Value

            xe = xe + 1
            rt.MoveNext()
        Loop
        cnt = rt.RecordCount

        vf = rt.RecordCount
        xe = 0
        rt.Close()
        rt = Nothing




        For uu = 0 To UBound(unicos) 'ESTRUCTURA DE CONTROL QUE VÁ DE 0 AL NÚMERO DE CCTS ÚNICOS QUE SE ESTÉN PROCESANDO
            datos(10) = unicos(uu)

            xe = 0

            rt = Nothing
            rt = New ADODB.Recordset
            rt.Open("Select distinct cct From alumnos where ID = " & datos(10) & " order by cct asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
            rt.MoveFirst()
            rt.MoveLast()

            ReDim Preserve Cescuelas(rt.RecordCount - 1)

            rt.MoveFirst()
            Do While Not rt.EOF
                Cescuelas(xe) = rt.Fields("CCT").Value

                xe = xe + 1
                rt.MoveNext()
            Loop



            For tt = 0 To UBound(Cescuelas) 'ESTRUCTURA DE CONTROL QUE VÁ DE 0 AL NÚMERO DE CCTS QUE SE ESTÉN PROCESANDO
                Application.DoEvents()


                datos(0) = Cescuelas(tt)






                xe = 0



                rt = Nothing
                rt = New ADODB.Recordset
                rt.Open("Select distinct(turno) From alumnos Where CCT = '" & datos(0) & "'" & "and ID = " & datos(10) & " order by turno asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                rt.MoveFirst()
                rt.MoveLast()
                ReDim Preserve Cturnos(rt.RecordCount - 1)

                rt.MoveFirst()
                Do While Not rt.EOF
                    Cturnos(xe) = rt.Fields("TURNO").Value

                    xe = xe + 1
                    rt.MoveNext()
                Loop
                xe = 0
                rt.Close()
                rt = Nothing


                'SE ALMACENAN TODOS LOS TURNOS EN LA MATRIZ Cturnos




                For TX = 0 To UBound(Cturnos) 'ESTRUCTURA DE CONTROL QUE VÁ DE 0 AL NÚMERO DE TURNOS QUE SE ESTÉN PROCESANDO
                    datos(6) = Cturnos(TX)

                    Select Case datos(6)'SELECTOR DE LA MATRIZ DATOS(6) PARA ASIGNAR EL NÚMERO DE TURNO
                        Case "MATUTINO"
                            r_turno = "1"
                        Case "VESPERTINO"
                            r_turno = "2"
                        Case "NOCTURNO"
                            r_turno = "3"
                        Case "CONTINUO"
                            r_turno = "4"
                        Case "DISCONTINUO"
                            r_turno = "5"
                        Case "COMPLETO"
                            r_turno = "6"
                        Case "JORNADA AMPLIADA"
                            r_turno = "7"
                        Case Else
                            r_turno = "0"
                    End Select

                    carpetacct = datos(0) & "." & Mid(datos(6), 1, 3) & "." & CStr(datos(10)) 'ESTA VARIABLE GUARDARÁ EL NOMBRE DE LA CARPETA QUE SE CREARÁ PARA ALMACENAR LOS ARCHIVOS PDFS CON LOS REPORTES
                    xe = 0
                    rt = Nothing
                    rt = New ADODB.Recordset
                    rt.Open("Select distinct(FASE) From alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & "and ID = " & datos(10) & " order by FASE asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                    rt.MoveFirst()
                    rt.MoveLast()
                    ReDim Preserve Cfases(rt.RecordCount - 1)
                    rt.MoveFirst()
                    Do While Not rt.EOF
                        Cfases(xe) = rt.Fields("FASE").Value
                        xe = xe + 1
                        rt.MoveNext()
                    Loop
                    xe = 0
                    rt.Close()
                    rt = Nothing

                    'SE ALMACENAN TODAS LAS FASES EN LA MATRIZ Cfases



                    For tf = 0 To UBound(Cfases) 'ESTRUCTURA DE CONTROL QUE VÁ DE 0 AL NÚMERO DE FASES QUE SE ESTÉN PROCESANDO
                        datos(8) = Cfases(tf)
                        Select Case datos(8)
                            Case "2"
                                datos(7) = "PREESCOLAR"
                            Case "3", "4", "5"
                                datos(7) = "PRIMARIA"
                            Case "6"
                                datos(7) = "SECUNDARIA"
                        End Select


                        xe = 0
                        rt = Nothing
                        rt = New ADODB.Recordset
                        rt.Open("Select distinct(grado) From alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & "and Fase = '" & datos(8) & "'" & "and ID = " & datos(10) & " order by grado asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                        rt.MoveFirst()
                        rt.MoveLast()
                        ReDim Preserve Cgrados(rt.RecordCount - 1)
                        rt.MoveFirst()
                        Do While Not rt.EOF
                            Cgrados(xe) = rt.Fields("GRADO").Value
                            xe = xe + 1
                            rt.MoveNext()
                        Loop

                        xe = 0
                        rt.Close()
                        rt = Nothing



                        'SE ALMACENAN TODOS LOS GRADOS EN LA MATRIZ Cgrados

                        For tg = 0 To UBound(Cgrados) 'ESTRUCTURA DE CONTROL QUE VÁ DE 0 AL NÚMERO DE GRADOS QUE SE ESTÉN PROCESANDO

                            datos(5) = Cgrados(tg)

                            xe = 0
                            rt = Nothing
                            rt = New ADODB.Recordset
                            rt.Open("Select distinct(grupo) From alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & "and Fase = '" & datos(8) & "'" & "and Grado = '" & datos(5) & "'" & "and ID = " & datos(10) & " order by grupo asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rt.MoveFirst()
                            rt.MoveLast()
                            ReDim Preserve Cgruposb(rt.RecordCount - 1)
                            rt.MoveFirst()
                            Do While Not rt.EOF
                                Cgruposb(xe) = rt.Fields("GRUPO").Value
                                xe = xe + 1
                                rt.MoveNext()
                            Loop

                            xe = 0
                            rt.Close()
                            rt = Nothing




                            For ny = 0 To UBound(Cgruposb)
                                datos(9) = Cgruposb(ny)
                                Call Imprime_Estudiantes_Grupo()

                            Next

                            Call Imprime()


                        Next







                    Next

                    'If carchivo > 48 Then
                    Call Genera_Carpetas_Grado(datos(10), carpetacct, datos(0), datos(6))
                    'End If

                    'carchivo = 0
                    rn = rn + 1
                    Label1.Text = rn & " DE " & finr 'SE ACTUALIZA LA ETIQUETA QUE INDICA EL CONTROL DE LOS CCT - TURNO QUE SE ESTÁN PROCESANDO



                Next


            Next


        Next




        'ExportarListaCorreoXlsx(ruta & "bd25.26.1.mdb", ruta2 & "Lista_Correo.xlsx") 'CREA LA LISTA DE EXCEL DE LOS CCT TURNOS ÚNICOS CON SU CORREO1 Y CORREO2 PARA POSTERIORMENTE COMBINAR MÁS ADELANTE Y ENVIARLOS MASIVAMENTE



        dbg = New ADODB.Connection
        dbg.Open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & ruta & "bd25.26.1.GLOBAL.mdb")

        sqlsentencia = ""

        sqlsentencia = "INSERT INTO ALUMNOS " & "SELECT * FROM ALUMNOS " & "IN '" & ruta & "bd25.26.1.mdb'"

        dbg.Execute(sqlsentencia)

        db.Execute("DELETE * FROM ALUMNOS")
        db.Execute("DELETE * FROM GRAFICAS")
        db.Execute("DELETE * FROM GRAFICAS2")

        dbg.Close()

        'AGREGA LOS REGISTROS QUE FUERON REPORTEADOS A UNA BASE DE DATOS GLOBAL, Y VACÍA LA BASE ACTUAL


        'MsgBox("¡ SE HAN GENERADO LOS REPORTES CORRESPONDIENTES !", MsgBoxStyle.Exclamation, "INFORMACIÓN PARA EL USUARIO") 'MENSAJE DE AFIRMACIÓN PARA EL USUARIO

        Label1.Visible = False
        Label2.Visible = False



        Guna2CircleProgressBar1.Visible = False

        PictureBox15.Visible = False

        PictureBox15.Visible = False

        Me.DoubleBuffered = False


        Exit Sub
CERRORES:
        MsgBox(Err.Description & vbCrLf & "ESCUELA: " & datos(0) & " " & datos(6), MsgBoxStyle.Critical, "ERROR ENCONTRADO") 'MENSAJE QUE INDICA EL CCT EN DONDE SE DETECTÓ EL ERROR SI EXISTIERA


    End Sub

    Sub Imprime()

        Genera_Graficas() 'COMPLEMENTO DE FUNCIONES QUE LLENARÁN LA INFORMACIÓN QUE UTILIZAN LOS REPORTES DE GRÁFICAS

        Dim crCon As New CrystalDecisions.Shared.ConnectionInfo
        Dim crtableLogoninfos As New CrystalDecisions.Shared.TableLogOnInfos
        Dim crtableLogoninfo As New CrystalDecisions.Shared.TableLogOnInfo
        Dim CrTables As CrystalDecisions.CrystalReports.Engine.Tables
        Dim CrTable As CrystalDecisions.CrystalReports.Engine.Table

        'SE DECLARAN LAS VARIABLES DE TIPO CRYSTAL REPORTS QUE SE UTILIZARÁN PARA LOS PROCEDIMIENTOS DE SALIDA EN LOS REPORTES

        regresa_turno = ""

        Select Case datos(6)'SELECTOR DE LA MATRIZ DATOS(6) PARA ASIGNAR EL NÚMERO DE TURNO
            Case "MATUTINO"
                regresa_turno = "1"
            Case "VESPERTINO"
                regresa_turno = "2"
            Case "NOCTURNO"
                regresa_turno = "3"

            Case "DISCONTINUO"
                regresa_turno = "4"
            Case "TIEMPO COMPLETO"
                regresa_turno = "5"
            Case "JORNADA AMPLIADA"
                regresa_turno = "6"
            Case Else
                regresa_turno = "0"
        End Select



        Application.DoEvents() 'PERMITE QUE SE EJECUTEN EVENTOS MIENTRAS SE EJECUTAN LOS SIGUIENTES PROCEDIMIENTOS

        If Directory.Exists("C:\RECIBE_SiCRER.25_26.SEPT\" & carpetacct) Then

        Else

            Directory.CreateDirectory("C:\RECIBE_SiCRER.25_26.SEPT\" & carpetacct)

        End If

        'EN ESTE APARTADO SE VA(N) A CREAR LA(S) CARPETA(S) POR CADA CCT - TURNO


        Dim cryRpt As New ReportDocument


        cryRpt.Load(ubicreporte & "res_esc_ens.rpt")

        With crCon
            .ServerName = "C:\SiCRER.25_26.SEPT\bd25.26.1.mdb"
            .UserID = "Admin"
            .Password = ""
        End With

        CrTables = cryRpt.Database.Tables
        For Each CrTable In CrTables
            crtableLogoninfo = CrTable.LogOnInfo
            crtableLogoninfo.ConnectionInfo = crCon
            CrTable.ApplyLogOnInfo(crtableLogoninfo)
        Next

        cryRpt.RecordSelectionFormula = "{graficas.CCT} = '" & datos(0) & "'" & " and {graficas.TURNO} = '" & datos(6) & "'" & " and {graficas.NIVEL} = '" & datos(7) & "'" & " and {graficas.GRADO} = '" & datos(5) & "'" & " and {Graficas.C_FORMATIVO} = 'ENS'"




        tipo_rep = "Esc_ens"

        Call ExportToPDF(cryRpt, datos(0) & "." & regresa_turno & ".Reporte_" & tipo_rep & "_F" & datos(8) & "." & datos(5) & "o." & CStr(datos(10)) & ".pdf")


        'EN LOS PROCEDIMIENTOS ANTERIORES SE ESTABLECE LA CONFIGURACIÓN DE LOS REPORTES, TAMBIÉN SE ELABORAN LAS CONSULTAS DEPENDIENDO DE LA FASE , NIVEL , GRADO QUE ESTÉ EN CURSO PARA POSTERIORMENTE
        'LLAMAR A LA FUNCIÓN QUE EXPORTA LOS ARCHIVOS EN FORMATO .PDF (ExportToPDF). CADA REPORTE TENDRÁ UN NOMBRE ESPECÍFICO QUE INDICA EL CCT , TURNO , EL TIPO DE REPORTE, LA FASE , Y GRADO CORRESPONDIENTE.



        cryRpt.Load(ubicreporte & "res_esc_hyc.rpt")

        With crCon
            .ServerName = "C:\SiCRER.25_26.SEPT\bd25.26.1.mdb"
            .UserID = "Admin"
            .Password = ""
        End With

        CrTables = cryRpt.Database.Tables
        For Each CrTable In CrTables
            crtableLogoninfo = CrTable.LogOnInfo
            crtableLogoninfo.ConnectionInfo = crCon
            CrTable.ApplyLogOnInfo(crtableLogoninfo)
        Next

        cryRpt.RecordSelectionFormula = "{graficas.CCT} = '" & datos(0) & "'" & " and {graficas.TURNO} = '" & datos(6) & "'" & " and {graficas.NIVEL} = '" & datos(7) & "'" & " and {graficas.GRADO} = '" & datos(5) & "'" & " and {Graficas.C_FORMATIVO} = 'HYC'"



        tipo_rep = "Esc_hyc"

        Call ExportToPDF(cryRpt, datos(0) & "." & regresa_turno & ".Reporte_" & tipo_rep & "_F" & datos(8) & "." & datos(5) & "o." & CStr(datos(10)) & ".pdf")


        'EN LOS PROCEDIMIENTOS ANTERIORES SE ESTABLECE LA CONFIGURACIÓN DE LOS REPORTES, TAMBIÉN SE ELABORAN LAS CONSULTAS DEPENDIENDO DE LA FASE , NIVEL , GRADO QUE ESTÉ EN CURSO PARA POSTERIORMENTE
        'LLAMAR A LA FUNCIÓN QUE EXPORTA LOS ARCHIVOS EN FORMATO .PDF (ExportToPDF). CADA REPORTE TENDRÁ UN NOMBRE ESPECÍFICO QUE INDICA EL CCT , TURNO , EL TIPO DE REPORTE, LA FASE , Y GRADO CORRESPONDIENTE.

        cryRpt.Load(ubicreporte & "res_esc_len.rpt")

        With crCon
            .ServerName = "C:\SiCRER.25_26.SEPT\bd25.26.1.mdb"
            .UserID = "Admin"
            .Password = ""
        End With

        CrTables = cryRpt.Database.Tables
        For Each CrTable In CrTables
            crtableLogoninfo = CrTable.LogOnInfo
            crtableLogoninfo.ConnectionInfo = crCon
            CrTable.ApplyLogOnInfo(crtableLogoninfo)
        Next

        cryRpt.RecordSelectionFormula = "{graficas.CCT} = '" & datos(0) & "'" & " and {graficas.TURNO} = '" & datos(6) & "'" & " and {graficas.NIVEL} = '" & datos(7) & "'" & " and {graficas.GRADO} = '" & datos(5) & "'" & " and {Graficas.C_FORMATIVO} = 'LEN'"




        tipo_rep = "Esc_len"

        Call ExportToPDF(cryRpt, datos(0) & "." & regresa_turno & ".Reporte_" & tipo_rep & "_F" & datos(8) & "." & datos(5) & "o." & CStr(datos(10)) & ".pdf")


        'EN LOS PROCEDIMIENTOS ANTERIORES SE ESTABLECE LA CONFIGURACIÓN DE LOS REPORTES, TAMBIÉN SE ELABORAN LAS CONSULTAS DEPENDIENDO DE LA FASE , NIVEL , GRADO QUE ESTÉ EN CURSO PARA POSTERIORMENTE
        'LLAMAR A LA FUNCIÓN QUE EXPORTA LOS ARCHIVOS EN FORMATO .PDF (ExportToPDF). CADA REPORTE TENDRÁ UN NOMBRE ESPECÍFICO QUE INDICA EL CCT , TURNO , EL TIPO DE REPORTE, LA FASE , Y GRADO CORRESPONDIENTE.

        cryRpt.Load(ubicreporte & "res_esc_spc.rpt")

        With crCon
            .ServerName = "C:\SiCRER.25_26.SEPT\bd25.26.1.mdb"
            .UserID = "Admin"
            .Password = ""
        End With

        CrTables = cryRpt.Database.Tables
        For Each CrTable In CrTables
            crtableLogoninfo = CrTable.LogOnInfo
            crtableLogoninfo.ConnectionInfo = crCon
            CrTable.ApplyLogOnInfo(crtableLogoninfo)
        Next

        cryRpt.RecordSelectionFormula = "{graficas.CCT} = '" & datos(0) & "'" & " and {graficas.TURNO} = '" & datos(6) & "'" & " and {graficas.NIVEL} = '" & datos(7) & "'" & " and {graficas.GRADO} = '" & datos(5) & "'" & " and {Graficas.C_FORMATIVO} = 'SPC'"


        tipo_rep = "Esc_spc"

        Call ExportToPDF(cryRpt, datos(0) & "." & regresa_turno & ".Reporte_" & tipo_rep & "_F" & datos(8) & "." & datos(5) & "o." & CStr(datos(10)) & ".pdf")


        'EN LOS PROCEDIMIENTOS ANTERIORES SE ESTABLECE LA CONFIGURACIÓN DE LOS REPORTES, TAMBIÉN SE ELABORAN LAS CONSULTAS DEPENDIENDO DE LA FASE , NIVEL , GRADO QUE ESTÉ EN CURSO PARA POSTERIORMENTE
        'LLAMAR A LA FUNCIÓN QUE EXPORTA LOS ARCHIVOS EN FORMATO .PDF (ExportToPDF). CADA REPORTE TENDRÁ UN NOMBRE ESPECÍFICO QUE INDICA EL CCT , TURNO , EL TIPO DE REPORTE, LA FASE , Y GRADO CORRESPONDIENTE.






    End Sub

    Sub Genera_Graficas()

        rt = Nothing
        rt = New ADODB.Recordset
        rt.Open("Select distinct(grupo) From alumnos Where cct = '" & datos(0) & "'" & " and FASE = '" & datos(8) & "'" & " and grado = '" & datos(5) & "'" & " and turno = '" & datos(6) & "'" & " and ID = " & datos(10) & " order by grupo asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)


        rt.MoveFirst()
        t = 0
        Do While Not rt.EOF
            ReDim Preserve Cgrupos(t)
            Cgrupos(t) = rt.Fields("grupo").Value
            t = t + 1
            rt.MoveNext()
        Loop



        Desc_Campo(0) = "LEN"
        Desc_Campo(1) = "SPC"
        Desc_Campo(2) = "ENS"
        Desc_Campo(3) = "HYC"


        'SE OBTIENE LOS GRUPOS DISTINTOS PARA PODER HACER LOS CÁLCULOS DE LAS GRÁFICAS





        db.Execute("Delete * From Graficas")
        rx = Nothing
        rx = New ADODB.Recordset
        rx.Open("Select * From Graficas", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)


        For yy = 0 To UBound(Cgrupos)
            For zz = 0 To 3
                rx.AddNew()
                rx.Fields("ENTIDAD").Value = datos(1)
                rx.Fields("CCT").Value = datos(0)
                rx.Fields("TURNO").Value = datos(6)
                rx.Fields("NIVEL").Value = Obtiene_Nivel(datos(8))
                rx.Fields("FASE").Value = datos(8)
                rx.Fields("GRADO").Value = datos(5)
                rx.Fields("GRUPO").Value = Cgrupos(yy)
                rx.Fields("C_FORMATIVO").Value = Desc_Campo(zz)
                rx.Fields("SE").Value = Conteo_Campo(Cgrupos(yy), "P" + Desc_Campo(zz), "SE")
                rx.Fields("RA").Value = Conteo_Campo(Cgrupos(yy), "P" + Desc_Campo(zz), "RA")
                rx.Fields("EPD").Value = Conteo_Campo(Cgrupos(yy), "P" + Desc_Campo(zz), "EPD")
                rx.Fields("AD").Value = Conteo_Campo(Cgrupos(yy), "P" + Desc_Campo(zz), "AD")
                rx.Update()
            Next
        Next

        rx.Close()
        rx = Nothing

        'GRÁFICAS POR GRUPO
        'EN ESTE APARTADO SE HACEN LOS CÁLCULOS DE LA TABLA GRAFICAS PARA SER UTILIZADA EN LOS REPORTES DE GRÁFICAS POR GRUPO




        db.Execute("Delete * From Graficas2")
        rx = Nothing
        rx = New ADODB.Recordset
        rx.Open("Select * From Graficas2", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)

        torden = 0
        For yy = 0 To UBound(Cgrupos)
            torden = yy + 1
            For zz = 0 To 3
                rx.AddNew()
                rx.Fields("ENTIDAD").Value = datos(1)
                rx.Fields("CCT").Value = datos(0)
                rx.Fields("TURNO").Value = datos(6)
                rx.Fields("NIVEL").Value = Obtiene_Nivel(datos(8))
                rx.Fields("FASE").Value = datos(8)
                rx.Fields("GRADO").Value = datos(5)
                rx.Fields("GRUPO").Value = Cgrupos(yy)
                rx.Fields("C_FORMATIVO").Value = Desc_Campo(zz)
                rx.Fields("SE_E").Value = PorcentajexCampo(Cgrupos(yy), "P" + Desc_Campo(zz), "SE")
                rx.Fields("RA_E").Value = PorcentajexCampo(Cgrupos(yy), "P" + Desc_Campo(zz), "RA")
                rx.Fields("EPD_E").Value = PorcentajexCampo(Cgrupos(yy), "P" + Desc_Campo(zz), "EPD")
                rx.Fields("AD_E").Value = PorcentajexCampo(Cgrupos(yy), "P" + Desc_Campo(zz), "AD")
                rx.Fields("ORDEN").Value = torden
                rx.Update()
            Next

        Next
        torden = torden + 1
        For zz = 0 To 3
            rx.AddNew()
            rx.Fields("ENTIDAD").Value = datos(1)
            rx.Fields("CCT").Value = datos(0)
            rx.Fields("TURNO").Value = datos(6)
            rx.Fields("NIVEL").Value = Obtiene_Nivel(datos(8))
            rx.Fields("FASE").Value = datos(8)
            rx.Fields("GRADO").Value = datos(5)
            rx.Fields("GRUPO").Value = "Global"
            rx.Fields("C_FORMATIVO").Value = Desc_Campo(zz)
            rx.Fields("SE_E").Value = PorcentajexCampoG("P" + Desc_Campo(zz), "SE")
            rx.Fields("RA_E").Value = PorcentajexCampoG("P" + Desc_Campo(zz), "RA")
            rx.Fields("EPD_E").Value = PorcentajexCampoG("P" + Desc_Campo(zz), "EPD")
            rx.Fields("AD_E").Value = PorcentajexCampoG("P" + Desc_Campo(zz), "AD")
            rx.Fields("ORDEN").Value = torden
            rx.Update()
        Next

        rt.Close()
        rx.Close()
        rx = Nothing

        Erase Cgrupos


        'GRÁFICAS POR ESCUELA
        'EN ESTE APARTADO SE HACEN LOS CÁLCULOS DE LA TABLA GRAFICAS2 PARA SER UTILIZADA EN LOS REPORTES DE GRÁFICAS POR ESCUELA

    End Sub

    Function Obtiene_Nivel(fase) As String
        Select Case fase
            Case "2"
                Obtiene_Nivel = "PREESCOLAR"
            Case "3"
                Obtiene_Nivel = "PRIMARIA"
            Case "4"
                Obtiene_Nivel = "PRIMARIA"
            Case "5"
                Obtiene_Nivel = "PRIMARIA"
            Case "6"
                Obtiene_Nivel = "SECUNDARIA"
        End Select
        'DEPENDIENDO DE LOS NÚMEROS 2 A 6 CONVIERTE AL NIVEL CORRESPONDIENTE EN TEXTO
    End Function
    Function PorcentajexCampo(grupo_s As String, Campo As String, nvl As String) As Single
        Dim tot_campo As Integer
        Dim tot_grupo As Integer
        Dim prefijo As String
        rz = Nothing
        rz = New ADODB.Recordset
        rz.Open("Select count(*) as conteo From Alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & " and Nivel  = '" & datos(7) & "'" & " and grado = '" & datos(5) & "'" & " and grupo = '" & grupo_s & "'" & " and " & Campo & " = '" & nvl & "'" & " and ID = " & datos(10), db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rz.MoveFirst()
        tot_campo = rz.Fields("conteo").Value
        rz.Close()
        rz = Nothing

        rz = Nothing
        rz = New ADODB.Recordset
        rz.Open("Select count(*) as conteoxgrupo From Alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & " and Nivel  = '" & datos(7) & "'" & " and grado = '" & datos(5) & "'" & " and grupo = '" & grupo_s & "'" & " and ID = " & datos(10), db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rz.MoveFirst()
        tot_grupo = rz.Fields("conteoxgrupo").Value
        rz.Close()
        rz = Nothing

        PorcentajexCampo = (tot_campo / tot_grupo) * 100
        prefijo = PorcentajexCampo
        If prefijo = "0" Then
            PorcentajexCampo = 0
        Else
            prefijo = Format(PorcentajexCampo, "##.#")
            PorcentajexCampo = CSng(prefijo)
        End If

        'OPERACIONES PARA OBTENER LOS PORCENTAJES POR NIVEL DE INTEGRACIÓN EN CADA CAMPO FORMATIVO POR GRUPO QUE SERÁN UTILIZADOS EN LAS GRÁFICAS
    End Function
    Function PorcentajexCampoG(Campo As String, nvl As String) As Single
        Dim tot_campo As Integer
        Dim tot_escuela As Integer
        Dim prefijo As String

        rz = Nothing
        rz = New ADODB.Recordset
        rz.Open("Select count(*) as conteo From Alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & " and Nivel  = '" & datos(7) & "'" & " and grado = '" & datos(5) & "'" & " and " & Campo & " = '" & nvl & "'" & " and ID = " & datos(10), db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rz.MoveFirst()
        tot_campo = rz.Fields("conteo").Value
        rz.Close()
        rz = Nothing

        rz = Nothing
        rz = New ADODB.Recordset
        rz.Open("Select count(*) as conteoxgrupo From Alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & " and Nivel  = '" & datos(7) & "'" & " and grado = '" & datos(5) & "'" & " and ID = " & datos(10), db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rz.MoveFirst()
        tot_escuela = rz.Fields("conteoxgrupo").Value
        rz.Close()
        rz = Nothing

        PorcentajexCampoG = (tot_campo / tot_escuela) * 100
        prefijo = PorcentajexCampoG

        If prefijo = "0" Then
            PorcentajexCampoG = 0
        Else
            prefijo = Format(PorcentajexCampoG, "##.#")
            PorcentajexCampoG = CSng(prefijo)
        End If

        'OPERACIONES PARA OBTENER LOS PORCENTAJES POR NIVEL DE INTEGRACIÓN EN CADA CAMPO FORMATIVO POR ESCUELA QUE SERÁN UTILIZADOS EN LAS GRÁFICAS

    End Function
    Function Conteo_Campo(grupo_s As String, Campo As String, nvl As String) As Integer
        rz = Nothing
        rz = New ADODB.Recordset

        rz.Open("Select count(*) as conteo From Alumnos Where CCT = '" & datos(0) & "'" & " and TURNO = '" & datos(6) & "'" & " and Nivel  = '" & datos(7) & "'" & " and grado = '" & datos(5) & "'" & " and grupo = '" & grupo_s & "'" & " and " & Campo & " = '" & nvl & "'" & " and ID = " & datos(10), db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rz.MoveFirst()
        Conteo_Campo = rz.Fields("conteo").Value
        rz.Close()
        rz = Nothing
        'CONTEO DE ESTUDIANTES POR NIVEL DE INTEGRACIÓN EN CADA GRUPO
    End Function

    Private Sub Guna2GradientButton1_Click(sender As Object, e As EventArgs)


    End Sub




    Function ENTIDAD_COLOCAR(ENT As String) As String


        Select Case Val(ENT)
            Case 1
                ENTIDAD_COLOCAR = "AGUASCALIENTES"
            Case 2
                ENTIDAD_COLOCAR = "BAJA CALIFORNIA"
            Case 3
                ENTIDAD_COLOCAR = "BAJA CALIFORNIA SUR"
            Case 4
                ENTIDAD_COLOCAR = "CAMPECHE"
            Case 5
                ENTIDAD_COLOCAR = "COAHUILA"

            Case 6
                ENTIDAD_COLOCAR = "COLIMA"
            Case 7
                ENTIDAD_COLOCAR = "CHIAPAS"
            Case 8
                ENTIDAD_COLOCAR = "CHIHUAHUA"
            Case 9
                ENTIDAD_COLOCAR = "CIUDAD DE MÉXICO"
            Case 10
                ENTIDAD_COLOCAR = "DURANGO"
            Case 11
                ENTIDAD_COLOCAR = "GUANAJUATO"
            Case 12
                ENTIDAD_COLOCAR = "GUERRERO"
            Case 13
                ENTIDAD_COLOCAR = "HIDALGO"
            Case 14
                ENTIDAD_COLOCAR = "JALISCO"
            Case 15
                ENTIDAD_COLOCAR = "ESTADO DE MÉXICO"
            Case 16
                ENTIDAD_COLOCAR = "MICHOACÁN"
            Case 17
                ENTIDAD_COLOCAR = "MORELOS"
            Case 18
                ENTIDAD_COLOCAR = "NAYARIT"
            Case 19
                ENTIDAD_COLOCAR = "NUEVO LEÓN"
            Case 20
                ENTIDAD_COLOCAR = "OAXACA"
            Case 21
                ENTIDAD_COLOCAR = "PUEBLA"
            Case 22
                ENTIDAD_COLOCAR = "QUERÉTARO"
            Case 23
                ENTIDAD_COLOCAR = "QUINTANA ROO"
            Case 24
                ENTIDAD_COLOCAR = "SAN LUIS POTOSÍ"
            Case 25
                ENTIDAD_COLOCAR = "SINALOA"
            Case 26
                ENTIDAD_COLOCAR = "SONORA"
            Case 27
                ENTIDAD_COLOCAR = "TABASCO"
            Case 28
                ENTIDAD_COLOCAR = "TAMAULIPAS"
            Case 29
                ENTIDAD_COLOCAR = "TLAXCALA"
            Case 30
                ENTIDAD_COLOCAR = "VERACRUZ"
            Case 31
                ENTIDAD_COLOCAR = "YUCATÁN"
            Case 32
                ENTIDAD_COLOCAR = "ZACATECAS"
            Case Else
                ENTIDAD_COLOCAR = ""

        End Select


        'ESTA FUNCIÓN REGRESA EL NOMBRE DE LA ENTIDAD CON LA NUMERACIÓN 1 A 32

    End Function

    Private Sub Guna2Button10_Click(sender As Object, e As EventArgs)

    End Sub

    Private Sub Guna2Button11_Click(sender As Object, e As EventArgs) Handles Guna2Button11.Click
        WindowState = FormWindowState.Minimized
        'MINIMIZA LA VENTANA
    End Sub

    Private Sub FileSystemWatcher1_Changed(sender As Object, e As FileSystemEventArgs)

    End Sub

    Private Sub Guna2GradientPanel1_Paint(sender As Object, e As PaintEventArgs) Handles Guna2GradientPanel1.Paint

    End Sub

    Private Sub Guna2GradientPanel2_Paint(sender As Object, e As PaintEventArgs) Handles Guna2GradientPanel2.Paint

    End Sub
    Sub INTEGRA_EXCEL(archivonom As String)


        dbxl = Nothing
        dbxl = New ADODB.Connection
        dbxl.Open("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" & ruta2 & archivonom & ";Extended Properties= ""Excel 12.0 Xml;HDR=Yes"";")

        'CONEXIÓN CON LA BASE DE DATOS EN EXCEL RESULTANTE DEL ARCHIVO DE EXCEL DETECTADO EN EL EVENTO



        Select Case Mid(archivonom, 16, 3)' SE OBTIENE LA PARTE DE LA CADENA DEL ARCHIVO DE EXCEL QUE INDICA EL NIVEL
            'SELECTOR DE NIVEL CATALOGADO CON PRI - PRIMARIA, SEC - SECUNDARIA
            Case "PRE"

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [PRE3$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL PRE3 CÓMO TABLA CORRESPONDIENTE A 3° DE PREESCOLAR

                Select Case rsxl.RecordCount
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO


                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "3"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value




                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "2"

                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_A2").Value = rsxl.Fields("EIA1_C1_A2").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C3_A2").Value = rsxl.Fields("EIA1_C3_A2").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value
                                rs.Fields("EIA2_C4_A2").Value = rsxl.Fields("EIA2_C4_A2").Value



                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)



                                .Update()
                                .Close()
                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL



                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select





            Case "PRI"

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [PRI1$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL PRI1 CÓMO TABLA CORRESPONDIENTE A 1° DE PRIMARIA
                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA

                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = CStr(Trim(rsxl.Fields("GRUPO").Value))
                                .Fields("grado").Value = "1"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("grado").Value = "1"





                                .Fields("fase").Value = "3"

                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_A2").Value = rsxl.Fields("EIA2_C3_A2").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value



                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)

                                .Fields("genero").Value = rsxl.Fields("genero").Value

                                .Update()
                                .Close()
                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL



                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop

                End Select




                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCE

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [PRI2$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL PRI2 CÓMO TABLA CORRESPONDIENTE A 2° DE PRIMARIA

                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA


                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "2"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "3"


                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_A2").Value = rsxl.Fields("EIA2_C3_A2").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value

                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)




                                .Update()
                                .Close()

                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL


                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop



                End Select



                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCE

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [PRI3$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL PRI2 CÓMO TABLA CORRESPONDIENTE A 3° DE PRIMARIA

                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA

                        ' MsgBox(rsxl.RecordCount)

                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "3"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "4"



                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_A2").Value = rsxl.Fields("EIA1_C1_A2").Value
                                rs.Fields("EIA1_C1_B1").Value = rsxl.Fields("EIA1_C1_B1").Value
                                rs.Fields("EIA1_C1_B2").Value = rsxl.Fields("EIA1_C1_B2").Value
                                rs.Fields("EIA1_C1_B3").Value = rsxl.Fields("EIA1_C1_B3").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C2_A3").Value = rsxl.Fields("EIA1_C2_A3").Value
                                rs.Fields("EIA1_C2_B1").Value = rsxl.Fields("EIA1_C2_B1").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C3_B1").Value = rsxl.Fields("EIA1_C3_B1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA1_C4_A2").Value = rsxl.Fields("EIA1_C4_A2").Value
                                rs.Fields("EIA1_C4_A3").Value = rsxl.Fields("EIA1_C4_A3").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C1_B1").Value = rsxl.Fields("EIA2_C1_B1").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_B1").Value = rsxl.Fields("EIA2_C3_B1").Value
                                rs.Fields("EIA2_C3_C1").Value = rsxl.Fields("EIA2_C3_C1").Value
                                rs.Fields("EIA2_C3_C2").Value = rsxl.Fields("EIA2_C3_C2").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value
                                rs.Fields("EIA2_C4_B1").Value = rsxl.Fields("EIA2_C4_B1").Value
                                rs.Fields("EIA2_C5_A1").Value = rsxl.Fields("EIA2_C5_A1").Value
                                rs.Fields("EIA2_C5_A2").Value = rsxl.Fields("EIA2_C5_A2").Value
                                rs.Fields("EIA2_C5_A3").Value = rsxl.Fields("EIA2_C5_A3").Value

                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)


                                .Update()
                                .Close()

                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL


                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select



                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCEL

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [PRI4$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL PRI4 CÓMO TABLA CORRESPONDIENTE A 4° DE PRIMARIA
                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "4"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "4"



                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_A2").Value = rsxl.Fields("EIA1_C1_A2").Value
                                rs.Fields("EIA1_C1_B1").Value = rsxl.Fields("EIA1_C1_B1").Value
                                rs.Fields("EIA1_C1_B2").Value = rsxl.Fields("EIA1_C1_B2").Value
                                rs.Fields("EIA1_C1_B3").Value = rsxl.Fields("EIA1_C1_B3").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C2_A3").Value = rsxl.Fields("EIA1_C2_A3").Value
                                rs.Fields("EIA1_C2_B1").Value = rsxl.Fields("EIA1_C2_B1").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C3_B1").Value = rsxl.Fields("EIA1_C3_B1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA1_C4_A2").Value = rsxl.Fields("EIA1_C4_A2").Value
                                rs.Fields("EIA1_C4_A3").Value = rsxl.Fields("EIA1_C4_A3").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C1_B1").Value = rsxl.Fields("EIA2_C1_B1").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_B1").Value = rsxl.Fields("EIA2_C3_B1").Value
                                rs.Fields("EIA2_C3_C1").Value = rsxl.Fields("EIA2_C3_C1").Value
                                rs.Fields("EIA2_C3_C2").Value = rsxl.Fields("EIA2_C3_C2").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value
                                rs.Fields("EIA2_C4_B1").Value = rsxl.Fields("EIA2_C4_B1").Value
                                rs.Fields("EIA2_C5_A1").Value = rsxl.Fields("EIA2_C5_A1").Value
                                rs.Fields("EIA2_C5_A2").Value = rsxl.Fields("EIA2_C5_A2").Value
                                rs.Fields("EIA2_C5_A3").Value = rsxl.Fields("EIA2_C5_A3").Value

                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)

                                .Update()
                                .Close()

                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL



                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select


                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCEL

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [PRI5$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL PRI5 CÓMO TABLA CORRESPONDIENTE A 5° DE PRIMARIA

                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "5"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "5"


                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_B1").Value = rsxl.Fields("EIA1_C1_B1").Value
                                rs.Fields("EIA1_C1_B2").Value = rsxl.Fields("EIA1_C1_B2").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_B1").Value = rsxl.Fields("EIA1_C2_B1").Value
                                rs.Fields("EIA1_C2_C1").Value = rsxl.Fields("EIA1_C2_C1").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C3_B1").Value = rsxl.Fields("EIA1_C3_B1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA1_C4_B1").Value = rsxl.Fields("EIA1_C4_B1").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C1_B1").Value = rsxl.Fields("EIA2_C1_B1").Value
                                rs.Fields("EIA2_C1_C1").Value = rsxl.Fields("EIA2_C1_C1").Value
                                rs.Fields("EIA2_C1_C2").Value = rsxl.Fields("EIA2_C1_C2").Value
                                rs.Fields("EIA2_C1_C3").Value = rsxl.Fields("EIA2_C1_C3").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C2_B1").Value = rsxl.Fields("EIA2_C2_B1").Value
                                rs.Fields("EIA2_C2_C1").Value = rsxl.Fields("EIA2_C2_C1").Value
                                rs.Fields("EIA2_C2_D1").Value = rsxl.Fields("EIA2_C2_D1").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_A2").Value = rsxl.Fields("EIA2_C3_A2").Value
                                rs.Fields("EIA2_C3_B1").Value = rsxl.Fields("EIA2_C3_B1").Value
                                rs.Fields("EIA2_C3_C1").Value = rsxl.Fields("EIA2_C3_C1").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value
                                rs.Fields("EIA2_C4_B1").Value = rsxl.Fields("EIA2_C4_B1").Value


                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)


                                .Update()
                                .Close()

                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL


                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select



                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCEL

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [PRI6$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL PRI6 CÓMO TABLA CORRESPONDIENTE A 6° DE PRIMARIA

                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "6"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "5"


                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_B1").Value = rsxl.Fields("EIA1_C1_B1").Value
                                rs.Fields("EIA1_C1_B2").Value = rsxl.Fields("EIA1_C1_B2").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_B1").Value = rsxl.Fields("EIA1_C2_B1").Value
                                rs.Fields("EIA1_C2_C1").Value = rsxl.Fields("EIA1_C2_C1").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C3_B1").Value = rsxl.Fields("EIA1_C3_B1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA1_C4_B1").Value = rsxl.Fields("EIA1_C4_B1").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C1_B1").Value = rsxl.Fields("EIA2_C1_B1").Value
                                rs.Fields("EIA2_C1_C1").Value = rsxl.Fields("EIA2_C1_C1").Value
                                rs.Fields("EIA2_C1_C2").Value = rsxl.Fields("EIA2_C1_C2").Value
                                rs.Fields("EIA2_C1_C3").Value = rsxl.Fields("EIA2_C1_C3").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C2_B1").Value = rsxl.Fields("EIA2_C2_B1").Value
                                rs.Fields("EIA2_C2_C1").Value = rsxl.Fields("EIA2_C2_C1").Value
                                rs.Fields("EIA2_C2_D1").Value = rsxl.Fields("EIA2_C2_D1").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_A2").Value = rsxl.Fields("EIA2_C3_A2").Value
                                rs.Fields("EIA2_C3_B1").Value = rsxl.Fields("EIA2_C3_B1").Value
                                rs.Fields("EIA2_C3_C1").Value = rsxl.Fields("EIA2_C3_C1").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value
                                rs.Fields("EIA2_C4_B1").Value = rsxl.Fields("EIA2_C4_B1").Value

                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)



                                .Update()
                                .Close()
                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL



                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select


                rsxl.Close()
            'SE CIERRA LA TABLA DE EXCEL
            Case "SEC"
                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [SEC1$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL SEC1 CÓMO TABLA CORRESPONDIENTE A 1° DE SECUNDARIA

                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "1"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "6"

                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_A2").Value = rsxl.Fields("EIA1_C1_A2").Value
                                rs.Fields("EIA1_C1_A3").Value = rsxl.Fields("EIA1_C1_A3").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA1_C4_B1").Value = rsxl.Fields("EIA1_C4_B1").Value
                                rs.Fields("EIA1_C5_A1").Value = rsxl.Fields("EIA1_C5_A1").Value
                                rs.Fields("EIA1_C5_B1").Value = rsxl.Fields("EIA1_C5_B1").Value
                                rs.Fields("EIA1_C5_C1").Value = rsxl.Fields("EIA1_C5_C1").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C1_A2").Value = rsxl.Fields("EIA2_C1_A2").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C2_A2").Value = rsxl.Fields("EIA2_C2_A2").Value
                                rs.Fields("EIA2_C2_B1").Value = rsxl.Fields("EIA2_C2_B1").Value
                                rs.Fields("EIA2_C2_B2").Value = rsxl.Fields("EIA2_C2_B2").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_B1").Value = rsxl.Fields("EIA2_C3_B1").Value
                                rs.Fields("EIA2_C3_C1").Value = rsxl.Fields("EIA2_C3_C1").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value



                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)


                                .Update()
                                .Close()

                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL


                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select


                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCEL

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [SEC2$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL SEC2 CÓMO TABLA CORRESPONDIENTE A 2° DE SECUNDARIA

                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "2"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "6"


                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_A2").Value = rsxl.Fields("EIA1_C1_A2").Value
                                rs.Fields("EIA1_C1_A3").Value = rsxl.Fields("EIA1_C1_A3").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA1_C4_B1").Value = rsxl.Fields("EIA1_C4_B1").Value
                                rs.Fields("EIA1_C5_A1").Value = rsxl.Fields("EIA1_C5_A1").Value
                                rs.Fields("EIA1_C5_B1").Value = rsxl.Fields("EIA1_C5_B1").Value
                                rs.Fields("EIA1_C5_C1").Value = rsxl.Fields("EIA1_C5_C1").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C1_A2").Value = rsxl.Fields("EIA2_C1_A2").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C2_A2").Value = rsxl.Fields("EIA2_C2_A2").Value
                                rs.Fields("EIA2_C2_B1").Value = rsxl.Fields("EIA2_C2_B1").Value
                                rs.Fields("EIA2_C2_B2").Value = rsxl.Fields("EIA2_C2_B2").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_B1").Value = rsxl.Fields("EIA2_C3_B1").Value
                                rs.Fields("EIA2_C3_C1").Value = rsxl.Fields("EIA2_C3_C1").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value



                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)



                                .Update()
                                .Close()

                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL


                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select


                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCEL

                rsxl = Nothing
                rsxl = New ADODB.Recordset
                rsxl.Open("Select * From [SEC3$]", dbxl, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                'SE UTILIZA LA HOJA DE EXCEL SEC3 CÓMO TABLA CORRESPONDIENTE A 3° DE SECUNDARIA

                Select Case rsxl.RecordCount' VERIFICA SI NO EXISTEN REGISTROS PARA EVITAR UN ERROR EN EL FLUJO DEL RECORDSET
                    Case 0

                    Case Else
                        rsxl.MoveFirst() 'SE MUEVE AL PRIMER REGISTRO DE LA TABLA
                        Do While Not rsxl.EOF 'RECORRE TODOS LOS REGISTROS DE LA TABLA EN EXCEL HASTA EL ÚLTIMO
                            rs = Nothing
                            rs = New ADODB.Recordset
                            rs.Open("Select * From alumnos", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
                            rs.AddNew()
                            'SE ABRE LA TABLA DE ALUMNOS DE LA BASE DE DATOS DE ACCESS PARA ALMACENAR LA INFORMACIÓN Y SE AÑADIRÁN REGISTROS A ELLA
                            With rs ' ESTA INSTRUCCIÓN SE UTILIZA PARA NO TENER QUE REPETIR rs. EN TODAS LAS SENTENCIAS POSTERIORES
                                .Fields("entidad").Value = ENTIDAD_COLOCAR(Mid(rsxl.Fields("CCT").Value, 1, 2))
                                .Fields("cct").Value = rsxl.Fields("CCT").Value
                                .Fields("turno").Value = rsxl.Fields("TURNO").Value
                                .Fields("nom_cct").Value = Trim(rsxl.Fields("NOM_CCT").Value)
                                .Fields("grupo").Value = Trim(rsxl.Fields("GRUPO").Value)
                                .Fields("grado").Value = "3"
                                .Fields("nivel").Value = rsxl.Fields("NIVEL").Value


                                .Fields("MATRICULA").Value = rsxl.Fields("MATRICULA_OPC").Value
                                .Fields("ALUMNO").Value = Trim(rsxl.Fields("ESTUDIANTE").Value)

                                .Fields("nlista").Value = rsxl.Fields("NLISTA").Value

                                .Fields("genero").Value = rsxl.Fields("genero").Value



                                .Fields("fase").Value = "6"


                                rs.Fields("EIA1_C1_A1").Value = rsxl.Fields("EIA1_C1_A1").Value
                                rs.Fields("EIA1_C1_A2").Value = rsxl.Fields("EIA1_C1_A2").Value
                                rs.Fields("EIA1_C1_A3").Value = rsxl.Fields("EIA1_C1_A3").Value
                                rs.Fields("EIA1_C2_A1").Value = rsxl.Fields("EIA1_C2_A1").Value
                                rs.Fields("EIA1_C2_A2").Value = rsxl.Fields("EIA1_C2_A2").Value
                                rs.Fields("EIA1_C2_B1").Value = rsxl.Fields("EIA1_C2_B1").Value
                                rs.Fields("EIA1_C3_A1").Value = rsxl.Fields("EIA1_C3_A1").Value
                                rs.Fields("EIA1_C3_A2").Value = rsxl.Fields("EIA1_C3_A2").Value
                                rs.Fields("EIA1_C4_A1").Value = rsxl.Fields("EIA1_C4_A1").Value
                                rs.Fields("EIA1_C4_A2").Value = rsxl.Fields("EIA1_C4_A2").Value
                                rs.Fields("EIA2_C1_A1").Value = rsxl.Fields("EIA2_C1_A1").Value
                                rs.Fields("EIA2_C1_A2").Value = rsxl.Fields("EIA2_C1_A2").Value
                                rs.Fields("EIA2_C1_A3").Value = rsxl.Fields("EIA2_C1_A3").Value
                                rs.Fields("EIA2_C2_A1").Value = rsxl.Fields("EIA2_C2_A1").Value
                                rs.Fields("EIA2_C2_A2").Value = rsxl.Fields("EIA2_C2_A2").Value
                                rs.Fields("EIA2_C3_A1").Value = rsxl.Fields("EIA2_C3_A1").Value
                                rs.Fields("EIA2_C3_A2").Value = rsxl.Fields("EIA2_C3_A2").Value
                                rs.Fields("EIA2_C3_A3").Value = rsxl.Fields("EIA2_C3_A3").Value
                                rs.Fields("EIA2_C4_A1").Value = rsxl.Fields("EIA2_C4_A1").Value
                                rs.Fields("EIA2_C4_A2").Value = rsxl.Fields("EIA2_C4_A2").Value


                                rs.Fields("PLEN").Value = rsxl.Fields("PLEN").Value
                                rs.Fields("PSPC").Value = rsxl.Fields("PSPC").Value
                                rs.Fields("PENS").Value = rsxl.Fields("PENS").Value
                                rs.Fields("PHYC").Value = rsxl.Fields("PHYC").Value

                                rs.Fields("CORREO1").Value = rsxl.Fields("CORREO1").Value
                                '  rs.Fields("CORREO2").Value = IIf(IsDBNull(rsxl.Fields("CORREO2").Value) = True, "", rsxl.Fields("CORREO2").Value)
                                rs.Fields("CORREO2").Value = rsxl.Fields("CORREO2").Value
                                rs.Fields("ID").Value = Val(rsxl.Fields("ID").Value)



                                .Update()
                                .Close()
                                'SE ACTUALIZA Y SE CIERRA LA TABLA ALUMNOS Y SE AGREGAN TODOS LOS REGISTROS DEL ARCHIVO DE EXCEL



                            End With

                            rsxl.MoveNext() 'PASA AL SIGUIENTE REGISTRO DE LA TABLA DE EXCEL
                        Loop
                End Select


                rsxl.Close()
                'SE CIERRA LA TABLA DE EXCEL

        End Select


        rsxl = Nothing
        dbxl.Close()
        dbxl = Nothing

        'EL OBJETO QUE ABRE LA TABLA DE EXCEL SE BORRA PARA QUE NO SE QUEDE EN MEMORIA , ASÍ CÓMO EL CIERRE DE LA BASE DE DATOS DE EXCEL Y SE BORRA EL OBJETO QUE LA CONTIENE

        File.Move(ruta2 & archivonom, ruta2 & "INTEGRADOS\" & archivonom)

        'UNA VEZ INTEGRADO EL ARCHIVO DE EXCEL A LA BASE DE DATOS , EL ARCHIVO DE EXCEL SE TRASLADA A LA SUBCARPETA INTEGRADOS

    End Sub

    Sub INTEGRA_EXCEL_2()

        Dim archivos As String() = Directory.GetFiles(ruta2, "*.xlsx")
        Dim arch As String
        ' Obtiene la lista de archivos en la carpeta

        For Each archivo As String In archivos ' Itera sobre cada archivo en la lista
            arch = Path.GetFileName(archivo)
            INTEGRA_EXCEL(arch) 'Vuelve a Integrar los archivos que aún se encuentran en la carpeta donde se reciben
        Next
    End Sub
    Public Sub ExportarListaCorreoXls(rutaAccess As String,
                                  rutaExcelDestino As String)

        Dim Tabla As String = "Alumnos"
        ' Optional passwordAccess As String = Nothing)'EN CASO DE PASSWORD

        ' Eliminar si ya existe (recomendado para evitar errores “table already exists”)
        If File.Exists(rutaExcelDestino) Then
            File.Delete(rutaExcelDestino)
        End If

        ' Cadena de conexión Access
        Dim cs As String

        cs = $"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={rutaAccess};Persist Security Info=False;"


        'cs = $"Provider=Microsoft.Jet.OLEDB.4.0;Data Source={rutaAccess};Persist Security Info=False;"

        ' cs = $"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={rutaAccess};Jet OLEDB:Database Password={passwordAccess};Persist Security Info=False; CON PASSWORD


        ' IMPORTANTE: duplicar comillas simples en ruta por seguridad
        'Dim rutaExcelEscapada As String = rutaExcelDestino.Replace("'", "''")

        ' Construir sentencia
        Dim sql As String =
        "SELECT CCT, TURNO, FIRST(CORREO1) AS CORREO1, FIRST(CORREO2) AS CORREO2 " &
        $"INTO [Excel 8.0;HDR=YES;Database={rutaExcelDestino}].[LISTA_CORREO] " &
        $"FROM [{Tabla}] GROUP BY CCT, TURNO;"

        Using cnn As New OleDbConnection(cs), cmd As New OleDbCommand(sql, cnn)
            cnn.Open()
            cmd.ExecuteNonQuery()
        End Using

    End Sub
    Public Sub ExportarListaCorreoXlsx(rutaAccess As String, rutaExcelDestino As String)
        Dim Tabla As String = "Alumnos"

        ' Eliminar si ya existe
        If File.Exists(rutaExcelDestino) Then File.Delete(rutaExcelDestino)

        ' Conexión a Access (.mdb o .accdb)
        Dim cs As String = $"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={rutaAccess};Persist Security Info=False;"

        ' Exportar a XLSX (Excel 2007+)
        Dim sql As String =
            "SELECT A.CCT, A.TURNO, FIRST(CORREO1) AS CORREO1, FIRST(CORREO2) AS CORREO2, COUNT(A.CCT) AS CONTEO, MUESTRA" &
            $"INTO [Excel 12.0 Xml;HDR=YES;Database={rutaExcelDestino}].[LISTA_CORREO] " &
            $"FROM [{Tabla}] as A INNER JOIN ESCUELAS AS B GROUP BY CCT, TURNO, CORREO1, CORREO2, MUESTRA;"

        Using cnn As New OleDbConnection(cs), cmd As New OleDbCommand(sql, cnn)
            cnn.Open()
            cmd.ExecuteNonQuery()
        End Using
    End Sub
    Sub Imprime_Estudiantes_Grupo()



        Genera_Graficas() 'COMPLEMENTO DE FUNCIONES QUE LLENARÁN LA INFORMACIÓN QUE UTILIZAN LOS REPORTES DE GRÁFICAS

            Dim crCon As New CrystalDecisions.Shared.ConnectionInfo
            Dim crtableLogoninfos As New CrystalDecisions.Shared.TableLogOnInfos
            Dim crtableLogoninfo As New CrystalDecisions.Shared.TableLogOnInfo
            Dim CrTables As CrystalDecisions.CrystalReports.Engine.Tables
            Dim CrTable As CrystalDecisions.CrystalReports.Engine.Table

            'SE DECLARAN LAS VARIABLES DE TIPO CRYSTAL REPORTS QUE SE UTILIZARÁN PARA LOS PROCEDIMIENTOS DE SALIDA EN LOS REPORTES

            regresa_turno = ""

            Select Case datos(6)'SELECTOR DE LA MATRIZ DATOS(6) PARA ASIGNAR EL NÚMERO DE TURNO
                Case "MATUTINO"
                    regresa_turno = "1"
                Case "VESPERTINO"
                    regresa_turno = "2"
                Case "NOCTURNO"
                    regresa_turno = "3"
                Case "CONTINUO"
                    regresa_turno = "4"
                Case "DISCONTINUO"
                    regresa_turno = "5"
                Case "COMPLETO"
                    regresa_turno = "6"
                Case "JORNADA AMPLIADA"
                    regresa_turno = "7"
                Case Else
                    regresa_turno = "0"
            End Select





            Application.DoEvents() 'PERMITE QUE SE EJECUTEN EVENTOS MIENTRAS SE EJECUTAN LOS SIGUIENTES PROCEDIMIENTOS


            If Directory.Exists("C:\RECIBE_SiCRER.25_26.SEPT\" & carpetacct) Then

            Else

                Directory.CreateDirectory("C:\RECIBE_SiCRER.25_26.SEPT\" & carpetacct)

            End If

            'EN ESTE APARTADO SE VA(N) A CREAR LA(S) CARPETA(S) POR CADA CCT - TURNO




            Dim cryRpt As New ReportDocument





            If (datos(8) = "6") And (datos(5) = "3") Then
                cryRpt.Load(ubicreporte & "res_est_f" & datos(8) & "a.rpt")

                With crCon
                    .ServerName = "C:\SiCRER.25_26.SEPT\bd25.26.1.mdb"
                    .UserID = "Admin"
                    .Password = ""
                End With

                CrTables = cryRpt.Database.Tables
                For Each CrTable In CrTables
                    crtableLogoninfo = CrTable.LogOnInfo
                    crtableLogoninfo.ConnectionInfo = crCon
                    CrTable.ApplyLogOnInfo(crtableLogoninfo)
                Next


            cryRpt.RecordSelectionFormula = "{alumnos.CCT} = '" & datos(0) & "'" & " and {alumnos.TURNO} = '" & datos(6) & "'" & " and {alumnos.NIVEL} = '" & datos(7) & "'" & " and {alumnos.GRADO} = '" & datos(5) & "'" & " and {alumnos.GRUPO} = '" & datos(9) & "'" & " and {alumnos.ID} = " & datos(10)


            tipo_rep = "Est_"

            Call ExportToPDF(cryRpt, datos(0) & "." & regresa_turno & ".Reporte_" & tipo_rep & "_F" & datos(8) & "." & datos(5) & "o" & datos(9) & "." & CStr(datos(10)) & ".pdf")

        Else
                cryRpt.Load(ubicreporte & "res_est_f" & datos(8) & ".rpt")

                With crCon
                    .ServerName = "C:\SiCRER.25_26.SEPT\bd25.26.1.mdb"
                    .UserID = "Admin"
                    .Password = ""
                End With

                CrTables = cryRpt.Database.Tables
                For Each CrTable In CrTables
                    crtableLogoninfo = CrTable.LogOnInfo
                    crtableLogoninfo.ConnectionInfo = crCon
                    CrTable.ApplyLogOnInfo(crtableLogoninfo)
                Next


            cryRpt.RecordSelectionFormula = "{alumnos.CCT} = '" & datos(0) & "'" & " and {alumnos.TURNO} = '" & datos(6) & "'" & " and {alumnos.NIVEL} = '" & datos(7) & "'" & " and {alumnos.GRADO} = '" & datos(5) & "'" & " and {alumnos.GRUPO} = '" & datos(9) & "'" & " and {alumnos.ID} = " & datos(10)


            tipo_rep = "Est_"

            Call ExportToPDF(cryRpt, datos(0) & "." & regresa_turno & ".Reporte_" & tipo_rep & "_F" & datos(8) & "." & datos(5) & "o" & datos(9) & "." & CStr(datos(10)) & ".pdf")








        End If

        'EN LOS PROCEDIMIENTOS ANTERIORES SE ESTABLECE LA CONFIGURACIÓN DE LOS REPORTES, TAMBIÉN SE ELABORAN LAS CONSULTAS DEPENDIENDO DE LA FASE , NIVEL , GRADO QUE ESTÉ EN CURSO PARA POSTERIORMENTE
        'LLAMAR A LA FUNCIÓN QUE EXPORTA LOS ARCHIVOS EN FORMATO .PDF (ExportToPDF). CADA REPORTE TENDRÁ UN NOMBRE ESPECÍFICO QUE INDICA EL CCT , TURNO , EL TIPO DE REPORTE, LA FASE , Y GRADO CORRESPONDIENTE.











    End Sub

    Private Sub Form1_Shown(sender As Object, e As EventArgs) Handles Me.Shown
        PictureBox1.Visible = False
        Label3.Visible = False
        Guna2ProgressIndicator1.Visible = False

        Me.Cursor = Cursors.WaitCursor 'CAMBIA EL ÍCONO DEL CURSOR A - CURSOR EN ESPERA

        Dim archivos As String() = Directory.GetFiles(ruta2, "*.xlsx")
        Dim arch As String
        ' Obtiene la lista de archivos en la carpeta

        For Each archivo As String In archivos ' Itera sobre cada archivo en la lista
            arch = Path.GetFileName(archivo)

            If Len(Trim(arch)) = 23 Then 'LA LONGITUD DEL NOMBRE DE ARCHIVO DEBERÁ SER DE 22 CARÁCTERES, DE LO CONTRARIO NO ES UN ARCHIVO VÁLIDO

                INTEGRA_EXCEL(arch) 'Vuelve a Integrar los archivos que aún se encuentran en la carpeta donde se reciben

            End If


        Next

        Me.Cursor = Cursors.Default 'CAMBIA EL ÍCONO DEL CURSOR A - CURSOR POR DEFAULT

        Me.Cursor = Cursors.WaitCursor 'CAMBIA EL ÍCONO DEL CURSOR A - CURSOR EN ESPERA

        Call Imprime_todo() 'FUNCIÓN GLOBAL QUE PROCESA LA INFORMACIÓN DE LA BASE DE DATOS PARA EXPORTAR TODOS LOS REPORTES A FORMATO PDF










        Me.Cursor = Cursors.Default 'CAMBIA EL ÍCONO DEL CURSOR A - CURSOR POR DEFAULT
        Close()
        End

    End Sub
    Sub Genera_Carpetas_Grado(idnum As Integer, carpetalugarcct As String, ncct As String, tur As String)
        Dim gr() As String
        Dim xe2 As Integer
        xe2 = 0


        rz = Nothing
        rz = New ADODB.Recordset
        rz.Open("Select distinct(grado) From alumnos where id = " & idnum & " and cct = '" & ncct & "'" & " and turno = '" & tur & "'" & " order by grado asc", db, ADODB.CursorTypeEnum.adOpenStatic, ADODB.LockTypeEnum.adLockOptimistic)
        rz.MoveFirst()
        rz.MoveLast()
        ReDim Preserve gr(rz.RecordCount - 1)
        rz.MoveFirst()
        Do While Not rz.EOF
            gr(xe2) = rz.Fields("GRADO").Value
            xe2 = xe2 + 1
            rz.MoveNext()
        Loop

        xe2 = 0
        rz.Close()
        rz = Nothing




        For cgr = 0 To UBound(gr)
            If Directory.Exists(ruta2 & carpetalugarcct & "\" & gr(cgr) & "\") Then

            Else

                Directory.CreateDirectory(ruta2 & carpetalugarcct & "\" & gr(cgr) & "\")


            End If

        Next



        Dim archivoscct() As String = Directory.GetFiles(ruta2 & carpetalugarcct & "\")

        For Each fileName As String In archivoscct
            Dim pos As Integer
            'Dim arc As String


            For uu = 0 To UBound(gr)
                pos = InStr(fileName, gr(uu) & "o")
                If pos <> 0 Then
                    'arc = Mid(fileName, pos - 1, 2)
                    Dim archivo_a_mover As String = System.IO.Path.GetFileName(fileName)
                    File.Move(fileName, ruta2 & carpetalugarcct & "\" & gr(uu) & "\" & archivo_a_mover)
                    Exit For
                End If

            Next






        Next
        Erase gr
    End Sub

    Private Sub Label5_Click(sender As Object, e As EventArgs) Handles Label5.Click

    End Sub

    Private Sub Form1_LostFocus(sender As Object, e As EventArgs) Handles Me.LostFocus

    End Sub
End Class
