"use client"

import { useState, useEffect } from "react"
import { ref, set, remove, get } from "firebase/database"
import { database } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, X } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"
import ExportButtons from "./export-buttons"
import HelpTooltip from "./help-tooltip"
import { useAuth } from "@/contexts/auth-context"

export default function ProductosTab({ proveedores }) {
  const { user } = useAuth()
  const [productos, setProductos] = useState({})
  const [showDialog, setShowDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProveedor, setFilterProveedor] = useState("")
  const [filterTipo, setFilterTipo] = useState("")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    // Precio de Compra eliminado
    precioVenta: "", // Solo se mantiene el precio de venta
    stock: "",
    stockMinimo: "",
    proveedor: "",
    tipo: "",
    codigo: "",
  })

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      // Precio de Compra eliminado
      precioVenta: "",
      stock: "",
      stockMinimo: "",
      proveedor: "",
      tipo: "",
      codigo: "",
    })
    setEditingProduct(null)
  }

  const generarIdProducto = () => {
    // Genera un id único simple (puedes usar uuid si lo prefieres)
    return "prod_" + Math.random().toString(36).substr(2, 9)
  }

  // Cargar productos desde Firebase
  const cargarProductos = async () => {
    if (!user?.id) return
    const productosRef = ref(database, `tiendas/${user.id}/productos`)
    const snapshot = await get(productosRef)
    if (snapshot.exists()) {
      setProductos(snapshot.val())
    } else {
      setProductos({})
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [user?.id])

  // Filtrar productos
  const productosArray = Object.entries(productos).map(([id, producto]) => ({
    id,
    ...producto,
  }))

  const filteredProducts = productosArray.filter((producto) => {
    const matchesSearch =
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProveedor = !filterProveedor || filterProveedor === "all" || producto.proveedor === filterProveedor
    const matchesTipo = !filterTipo || filterTipo === "all" || producto.tipo === filterTipo

    return matchesSearch && matchesProveedor && matchesTipo
  })

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Cuando cambian los filtros, volver a la primera página
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterProveedor, filterTipo])

  // Obtener tipos únicos
  const tiposUnicos = [...new Set(productosArray.map((p) => p.tipo).filter(Boolean))]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user?.id) {
      alert("Usuario no autenticado")
      return
    }

    // Validación de campos obligatorios
    if (
      !formData.nombre.trim() ||
      !formData.codigo.trim() ||
      !formData.tipo.trim() ||
      !formData.proveedor.trim() ||
      !formData.precioVenta ||
      isNaN(Number(formData.precioVenta)) ||
      !formData.stock ||
      isNaN(Number(formData.stock)) ||
      !formData.stockMinimo ||
      isNaN(Number(formData.stockMinimo))
    ) {
      alert("Completa todos los campos obligatorios correctamente.")
      return
    }

    const productId = editingProduct || generarIdProducto()
    const productData = {
      ...formData,
      precioVenta: Number.parseFloat(formData.precioVenta),
      stock: Number.parseInt(formData.stock),
      stockMinimo: Number.parseInt(formData.stockMinimo),
      fechaCreacion: new Date().toISOString(),
      usuarioId: user.id,
      id: productId,
    }

    try {
      await set(ref(database, `tiendas/${user.id}/productos/${productId}`), productData)
      setShowDialog(false)
      resetForm()
      await cargarProductos()
    } catch (error) {
      alert("Error al guardar producto: " + error.message)
      console.error("Error al guardar producto:", error)
    }
  }

  const handleEdit = (id, producto) => {
    setEditingProduct(id)
    // Asegurarse de que los campos de precio de compra y venta estén presentes
    const productToEdit = {
      ...producto,
      // precioCompra: producto.precioCompra || producto.precio, // Eliminado
      precioVenta: producto.precioVenta || producto.precio, // Asegurarse de que se use este
    }
    setFormData(productToEdit)
    setShowDialog(true)
  }

  const handleDelete = async (id) => {
    if (!user?.id) {
      console.error("Usuario no autenticado")
      return
    }

    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await remove(ref(database, `tiendas/${user.id}/productos/${id}`))
        await cargarProductos() // Recargar productos después de eliminar
      } catch (error) {
        console.error("Error al eliminar producto:", error)
      }
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("")
    setFilterProveedor("")
    setFilterTipo("")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Gestión de Productos</CardTitle>
            <HelpTooltip
              title="Ayuda - Gestión de Productos"
              content={
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-blue-600">¿Qué puedes hacer aquí?</h4>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li><strong>Crear productos:</strong> Agrega nuevos productos al catálogo</li>
                      <li><strong>Editar productos:</strong> Modifica información existente</li>
                      <li><strong>Gestionar stock:</strong> Controla inventario y stock mínimo</li>
                      <li><strong>Filtrar y buscar:</strong> Encuentra productos rápidamente</li>
                      <li><strong>Exportar datos:</strong> Descarga el catálogo en PDF, Excel o CSV</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600">Funcionalidades principales:</h4>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li><strong>Búsqueda:</strong> Por nombre o código de producto</li>
                      <li><strong>Filtros:</strong> Por proveedor y tipo de producto</li>
                      <li><strong>Stock:</strong> Control automático de inventario</li>
                      <li><strong>Precios:</strong> Gestión de precios de venta</li>
                      <li><strong>Proveedores:</strong> Asociación con proveedores</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Usa los filtros para organizar mejor tu catálogo y mantén actualizado el stock mínimo para recibir alertas automáticas.
                    </p>
                  </div>
                </div>
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <ExportButtons 
              data={productosArray} 
              type="productos" 
              title="Catálogo de Productos"
            />
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="codigo">Código</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Input
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="proveedor">Proveedor</Label>
                      <Select value={formData.proveedor} onValueChange={(value) => setFormData({ ...formData, proveedor: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(proveedores).map(([id, proveedor]) => (
                            <SelectItem key={id} value={id}>
                              {proveedor.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="precioVenta">Precio Venta</Label>
                      <Input
                        id="precioVenta"
                        type="number"
                        step="0.01"
                        value={formData.precioVenta}
                        onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                      <Input
                        id="stockMinimo"
                        type="number"
                        value={formData.stockMinimo}
                        onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProduct ? "Actualizar" : "Crear"} Producto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filterProveedor} onValueChange={setFilterProveedor}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {Object.entries(proveedores).map(([id, proveedor]) => (
                  <SelectItem key={id} value={id}>
                    {proveedor.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposUnicos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || filterProveedor || filterTipo) && (
              <Button variant="outline" onClick={limpiarFiltros} className="w-full sm:w-auto bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Proveedor</TableHead>
                {/* Eliminado Precio Compra de la tabla */}
                <TableHead>Precio Venta</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-mono">{producto.codigo}</TableCell>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>{producto.tipo}</TableCell>
                    <TableCell>{proveedores[producto.proveedor]?.nombre || "Sin proveedor"}</TableCell>
                    {/* Eliminado Precio Compra de la tabla */}
                    <TableCell>${producto.precioVenta?.toFixed(2) || producto.precio?.toFixed(2)}</TableCell>
                    <TableCell>{producto.stock}</TableCell>
                    <TableCell>
                      {producto.stock <= producto.stockMinimo ? (
                        <Badge variant="destructive">Stock Bajo</Badge>
                      ) : (
                        <Badge variant="default">Disponible</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(producto.id, producto)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(producto.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </CardContent>
    </Card>
  )
}
