"use client"

import { useState, useEffect, useRef } from "react"
import { ref, push, set, remove } from "firebase/database"
import { ref as storageRef, uploadBytes as uploadStorageBytes, getDownloadURL as getStorageDownloadURL } from "firebase/storage"
import { database, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Search, X, Share2, ShoppingCart, Image, Upload, Copy, ExternalLink, Package, Store } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import TiendaConfig from "./tienda-config"

interface Producto {
  id?: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  imagen: string
  destacado: boolean
  activo: boolean
  fechaCreacion?: string
  tiendaId?: string
}

interface User {
  id?: string
  uid?: string // Mantener compatibilidad
  phone?: string
  name?: string
  email?: string
  role?: string
  empresa?: string
}

export default function TiendaTab({ productos, user }: { productos: Record<string, Producto>, user: User }) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategoria, setFilterCategoria] = useState("todas")
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedProductForShare, setSelectedProductForShare] = useState(null)
  const [tiendaConfig, setTiendaConfig] = useState({
    nombre: "Mi Tienda",
    descripcion: "Los mejores productos al mejor precio",
    telefono: "",
    whatsapp: "",
    direccion: "",
    horarios: "",
    logo: ""
  })
  
  const fileInputRef = useRef(null)
  const { toast } = useToast()
  const itemsPerPage = 12



  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    categoria: "",
    imagen: "",
    destacado: false,
    activo: true
  })

  // Cargar configuración de la tienda
  useEffect(() => {
    if (user?.uid) {
      const tiendaRef = ref(database, `tiendas/${user.uid}/config`)
      // Aquí podrías cargar la configuración si existe
    }
  }, [user])

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
      stock: "",
      categoria: "",
      imagen: "",
      destacado: false,
      activo: true
    })
    setEditingProduct(null)
    setSelectedImage(null)
    setImagePreview("")
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return ""
    
    setUploadingImage(true)
    try {
      const imageRef = storageRef(storage, `tienda/${user.uid}/${Date.now()}_${file.name}`)
      const snapshot = await uploadStorageBytes(imageRef, file)
      const downloadURL = await getStorageDownloadURL(snapshot.ref)
      setUploadingImage(false)
      return downloadURL
    } catch (error) {
      console.error("Error al subir imagen:", error)
      setUploadingImage(false)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive"
      })
      return ""
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setImagePreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let imagenURL = formData.imagen
    
    if (selectedImage) {
      imagenURL = await handleImageUpload(selectedImage)
    }

    const productData = {
      ...formData,
      precio: Number.parseFloat(formData.precio),
      stock: Number.parseInt(formData.stock),
      imagen: imagenURL,
      fechaCreacion: new Date().toISOString(),
      tiendaId: user.uid
    }

    try {
      if (editingProduct) {
        await set(ref(database, `tiendas/${user.uid}/productos/${editingProduct}`), productData)
        toast({
          title: "Producto actualizado",
          description: "El producto se actualizó correctamente"
        })
      } else {
        await push(ref(database, `tiendas/${user.uid}/productos`), productData)
        toast({
          title: "Producto agregado",
          description: "El producto se agregó correctamente"
        })
      }

      setShowDialog(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar producto:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (id, producto) => {
    setEditingProduct(id)
    setFormData(producto)
    setImagePreview(producto.imagen || "")
    setShowDialog(true)
  }

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await remove(ref(database, `tiendas/${user.uid}/productos/${id}`))
        toast({
          title: "Producto eliminado",
          description: "El producto se eliminó correctamente"
        })
      } catch (error) {
        console.error("Error al eliminar producto:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          variant: "destructive"
        })
      }
    }
  }

  const handleShare = (producto) => {
    setSelectedProductForShare(producto)
    setShowShareDialog(true)
  }

  const generateWhatsAppMessage = (producto) => {
    const mensaje = `¡Hola! Te comparto este producto de mi tienda:\n\n` +
      `*${producto.nombre}*\n` +
      `${producto.descripcion}\n\n` +
      `💰 Precio: $${producto.precio}\n` +
      `📦 Stock disponible: ${producto.stock} unidades\n\n` +
      `¿Te interesa? ¡Contáctame para más información!`
    
    return encodeURIComponent(mensaje)
  }

  const generateBuyWhatsAppMessage = (producto) => {
    const mensaje = `¡Hola! Quiero comprar:\n\n` +
      `*${producto.nombre}*\n` +
      `💰 Precio: $${producto.precio}\n\n` +
      `¿Tienes stock disponible?`
    
    return encodeURIComponent(mensaje)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "Enlace copiado al portapapeles"
    })
  }

  const limpiarFiltros = () => {
    setSearchTerm("")
    setFilterCategoria("todas")
    setCurrentPage(1)
  }

  // Filtrar productos
  const productosFiltrados = Object.entries(productos || {})
    .filter(([id, producto]) => {
      const matchesSearch = producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategoria = filterCategoria === "todas" || !filterCategoria || producto.categoria === filterCategoria
      return matchesSearch && matchesCategoria
    })
    .map(([id, producto]) => ({ id, ...producto }))

  // Paginación
  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const productosPaginados = productosFiltrados.slice(startIndex, startIndex + itemsPerPage)

  const categorias = [...new Set(Object.values(productos || {}).map(p => p.categoria).filter(Boolean))]

  // Verificar si el usuario está disponible
  if (!user?.uid) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Usuario no identificado</h3>
          <p className="text-gray-600">No se puede cargar la tienda. Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
             {/* Header con botón de compartir catálogo */}
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
         <div>
           <h2 className="text-2xl font-bold">Mi Tienda</h2>
           <p className="text-muted-foreground">Gestiona tus productos y configura tu catálogo público</p>
         </div>
                   <div className="flex gap-2">
            <Button
              variant="outline"
                             onClick={() => {
                 if (user?.uid) {
                   const tiendaURL = `${window.location.origin}/tienda/${user.uid}`
                   copyToClipboard(tiendaURL)
                 } else {
                   toast({
                     title: "Error",
                     description: "No se puede compartir el catálogo. Usuario no identificado.",
                     variant: "destructive"
                   })
                 }
               }}
               disabled={!user?.uid}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartir Catálogo
            </Button>
          </div>
       </div>

       {/* Tabs para Productos y Configuración */}
       <Tabs defaultValue="productos" className="space-y-6">
         <TabsList className="grid w-full grid-cols-2">
           <TabsTrigger value="productos">Mis Productos</TabsTrigger>
           <TabsTrigger value="configuracion">Configuración</TabsTrigger>
         </TabsList>

        <TabsContent value="productos" className="space-y-6">
          {/* Header con estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productosFiltrados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {productosFiltrados.filter(p => p.activo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Destacados</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {productosFiltrados.filter(p => p.destacado).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {productosFiltrados.filter(p => p.stock <= 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || (filterCategoria && filterCategoria !== "todas")) && (
            <Button variant="outline" onClick={limpiarFiltros} size="sm">
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Producto *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio">Precio *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    placeholder="Ej: Electrónicos, Ropa, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen del Producto</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingImage ? "Subiendo..." : "Seleccionar Imagen"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="destacado"
                    checked={formData.destacado}
                    onChange={(e) => setFormData({...formData, destacado: e.target.checked})}
                  />
                  <Label htmlFor="destacado">Producto Destacado</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  />
                  <Label htmlFor="activo">Producto Activo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploadingImage}>
                  {editingProduct ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productosPaginados.map((producto) => (
          <Card key={producto.id} className="overflow-hidden">
            <div className="relative">
              {producto.imagen ? (
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {producto.destacado && (
                <Badge className="absolute top-2 left-2 bg-yellow-500">
                  Destacado
                </Badge>
              )}
              
              {!producto.activo && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Inactivo
                </Badge>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg truncate">{producto.nombre}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {producto.descripcion}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    ${producto.precio}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Stock: {producto.stock}
                  </span>
                </div>

                {producto.categoria && (
                  <Badge variant="outline" className="text-xs">
                    {producto.categoria}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(producto.id, producto)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare(producto)}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Compartir
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(producto.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

                             {/* Botón Comprar por WhatsApp */}
               {producto.activo && producto.stock > 0 && (tiendaConfig.whatsapp || user?.phone) && (
                 <Button
                   className="w-full mt-2 bg-green-600 hover:bg-green-700"
                   onClick={() => {
                     const mensaje = generateBuyWhatsAppMessage(producto)
                     const whatsappURL = `https://wa.me/${tiendaConfig.whatsapp || user?.phone}?text=${mensaje}`
                     window.open(whatsappURL, '_blank')
                   }}
                 >
                   <ShoppingCart className="h-4 w-4 mr-2" />
                   Comprar por WhatsApp
                 </Button>
               )}
            </CardContent>
          </Card>
        ))}
      </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <Pagination.Prev
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
                <Pagination.Item>{currentPage} de {totalPages}</Pagination.Item>
                <Pagination.Next
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </TabsContent>

        <TabsContent value="configuracion">
          <TiendaConfig user={user} />
        </TabsContent>
      </Tabs>

      {/* Dialog para compartir */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartir Producto</DialogTitle>
          </DialogHeader>
          
          {selectedProductForShare && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedProductForShare.imagen && (
                  <img
                    src={selectedProductForShare.imagen}
                    alt={selectedProductForShare.nombre}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{selectedProductForShare.nombre}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${selectedProductForShare.precio}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label>Compartir por WhatsApp</Label>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      const mensaje = generateWhatsAppMessage(selectedProductForShare)
                      const whatsappURL = `https://wa.me/${tiendaConfig.whatsapp || user.phone}?text=${mensaje}`
                      window.open(whatsappURL, '_blank')
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Enviar por WhatsApp
                  </Button>
                </div>

                                 <div>
                   <Label>Enlace directo del producto</Label>
                   <div className="flex gap-2">
                                           <Input
                        value={`${window.location.origin}/tienda/${user.uid}/producto/${selectedProductForShare.id}`}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}/tienda/${user.uid}/producto/${selectedProductForShare.id}`)}
                      >
                       <Copy className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>

                                   <div>
                    <Label>Enlace del catálogo completo</Label>
                    <div className="flex gap-2">
                                             <Input
                         value={user?.uid ? `${window.location.origin}/tienda/${user.uid}` : "Usuario no identificado"}
                         readOnly
                       />
                       <Button
                         variant="outline"
                         onClick={() => {
                           if (user?.uid) {
                             copyToClipboard(`${window.location.origin}/tienda/${user.uid}`)
                           } else {
                             toast({
                               title: "Error",
                               description: "No se puede copiar el enlace. Usuario no identificado.",
                               variant: "destructive"
                             })
                           }
                         }}
                         disabled={!user?.uid}
                       >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 