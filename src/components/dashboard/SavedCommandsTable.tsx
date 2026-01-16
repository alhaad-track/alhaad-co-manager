import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";
import { getCommands, deleteCommand } from "@/lib/api";
import SavedCommandForm from "./SavedCommandForm";
import { useNotification } from "@/context/NotificationContext";
import { DeleteDialog } from "@/components/ui/delete-dialog";

export default function SavedCommandsTable() {
    const [commands, setCommands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCommand, setEditingCommand] = useState<any>(null);
    const { addNotification } = useNotification();

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [commandToDelete, setCommandToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCommands = async () => {
        setLoading(true);
        try {
            const data = await getCommands();
            setCommands(data);
        } catch (error) {
            console.error("Failed to fetch commands", error);
            addNotification("error", "Error", "Failed to fetch saved commands");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommands();
    }, []);

    const confirmDelete = (id: number) => {
        setCommandToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!commandToDelete) return;

        setIsDeleting(true);
        try {
            await deleteCommand(commandToDelete);
            addNotification("success", "Success", "Command deleted successfully");
            fetchCommands();
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete command", error);
            addNotification("error", "Error", "Failed to delete command");
        } finally {
            setIsDeleting(false);
            setCommandToDelete(null); // Cleanup
        }
    };

    const handleEdit = (command: any) => {
        setEditingCommand(command);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingCommand(null);
        setIsFormOpen(true);
    };

    const handleSuccess = () => {
        fetchCommands();
        addNotification("success", "Success", "Command saved successfully");
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Saved Commands</h2>
                <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Command
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : commands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No saved commands found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            commands.map((command) => (
                                <TableRow key={command.id}>
                                    <TableCell className="font-medium">{command.description}</TableCell>
                                    <TableCell>{command.type}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(command)}
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => confirmDelete(command.id)}
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <SavedCommandForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                currentCommand={editingCommand}
                onSuccess={handleSuccess}
            />

            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDelete}
                title="Delete Saved Command"
                description="Are you sure you want to delete this command? This action cannot be undone."
                isLoading={isDeleting}
            />
        </div>
    );
}
