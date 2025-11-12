import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Tabs,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "@/lib/db";
import { AppSchema } from "@/instant.schema";
import { InstaQLEntity } from "@instantdb/react-native";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";

type EntityType =
  | "bookings"
  | "chat"
  | "contributors"
  | "conversations"
  | "instances"
  | "lineitems"
  | "memories"
  | "nodes"
  | "orders"
  | "products"
  | "reviews"
  | "services"
  | "slots"
  | "tasks"
  | "transactions";

const ENTITY_LABELS: Record<EntityType, string> = {
  bookings: "Bookings",
  chat: "Chat",
  contributors: "Contributors",
  conversations: "Conversations",
  instances: "Instances",
  lineitems: "Line Items",
  memories: "Memories",
  nodes: "Nodes",
  orders: "Orders",
  products: "Products",
  reviews: "Reviews",
  services: "Services",
  slots: "Slots",
  tasks: "Tasks",
  transactions: "Transactions",
};

// Define display columns for each entity
const ENTITY_COLUMNS: Record<EntityType, string[]> = {
  bookings: ["ID", "Booking #", "Name", "Date", "Status", "Price"],
  chat: ["ID", "Message", "Type", "Contributor", "Created"],
  contributors: ["ID", "Name", "Email", "Role", "Active"],
  conversations: ["ID", "Title", "Contributor", "Updated"],
  instances: ["ID", "Name", "Type", "Status", "Available"],
  lineitems: ["ID", "Name", "Product", "Qty", "Unit Price", "Total"],
  memories: ["ID", "Content", "Role", "Created"],
  nodes: ["ID", "Name", "Type", "Email", "City", "Rating"],
  orders: ["ID", "Order #", "Status", "Total", "Node"],
  products: ["ID", "Name", "Price", "Category", "Stock"],
  reviews: ["ID", "Rating", "Target Type", "Comment", "Verified"],
  services: ["ID", "Name", "Price", "Category", "Duration"],
  slots: ["ID", "Date", "Time", "Capacity", "Status"],
  tasks: ["ID", "Title", "Status", "Type", "Assigned To"],
  transactions: ["ID", "Amount", "Status", "Method", "Created"],
};

function useEntityData(entityType: EntityType) {
  const queryObj: any = {};
  queryObj[entityType] = {};

  const { data, isLoading, error } = db.useQuery(queryObj);

  return {
    items: data?.[entityType] || [],
    isLoading,
    error,
  };
}

function getColumnValue(item: any, entity: EntityType, columnIndex: number): string {
  // ID column (always first)
  if (columnIndex === 0) {
    return item.id?.substring(0, 8) || "-";
  }

  switch (entity) {
    case "bookings":
      switch (columnIndex) {
        case 1: return item.bookingnum || "-";
        case 2: return item.name || "-";
        case 3: return item.date || "-";
        case 4: return item.status || "-";
        case 5: return `${item.price || 0}`;
        default: return "-";
      }
    case "chat":
      switch (columnIndex) {
        case 1: return item.message?.substring(0, 40) || "-";
        case 2: return item.msgtype || "-";
        case 3: return item.contributorid?.substring(0, 8) || "-";
        case 4: return item.createdat ? new Date(item.createdat).toLocaleDateString() : "-";
        default: return "-";
      }
    case "contributors":
      switch (columnIndex) {
        case 1: return item.name || "-";
        case 2: return item.email || "-";
        case 3: return item.role || "-";
        case 4: return item.active ? "Yes" : "No";
        default: return "-";
      }
    case "conversations":
      switch (columnIndex) {
        case 1: return item.title || "-";
        case 2: return item.contributorid?.substring(0, 8) || "-";
        case 3: return item.updatedat ? new Date(item.updatedat).toLocaleDateString() : "-";
        default: return "-";
      }
    case "instances":
      switch (columnIndex) {
        case 1: return item.name || "-";
        case 2: return item.instancetype || "-";
        case 3: return item.status || "-";
        case 4: return `${item.available || 0}`;
        default: return "-";
      }
    case "lineitems":
      switch (columnIndex) {
        case 1: return item.name || "-";
        case 2: return item.productid?.substring(0, 8) || "-";
        case 3: return `${item.qty || 0}`;
        case 4: return `${item.unitprice || 0}`;
        case 5: return `${item.total || 0}`;
        default: return "-";
      }
    case "memories":
      switch (columnIndex) {
        case 1: return item.content?.substring(0, 40) || "-";
        case 2: return item.role || "-";
        case 3: return item.createdat ? new Date(item.createdat).toLocaleDateString() : "-";
        default: return "-";
      }
    case "nodes":
      switch (columnIndex) {
        case 1: return item.name || "-";
        case 2: return item.type || "-";
        case 3: return item.email || "-";
        case 4: return item.city || "-";
        case 5: return `${item.rating || 0}`;
        default: return "-";
      }
    case "orders":
      switch (columnIndex) {
        case 1: return item.ordernum || "-";
        case 2: return item.status || "-";
        case 3: return `${item.total || 0}`;
        case 4: return item.nodeid?.substring(0, 8) || "-";
        default: return "-";
      }
    case "products":
      switch (columnIndex) {
        case 1: return item.name || "-";
        case 2: return `${item.price || 0}`;
        case 3: return item.category || "-";
        case 4: return `${item.stock || 0}`;
        default: return "-";
      }
    case "reviews":
      switch (columnIndex) {
        case 1: return `${item.rating || 0}`;
        case 2: return item.targettype || "-";
        case 3: return item.comment?.substring(0, 30) || "-";
        case 4: return item.verified ? "Yes" : "No";
        default: return "-";
      }
    case "services":
      switch (columnIndex) {
        case 1: return item.name || "-";
        case 2: return `${item.price || 0}`;
        case 3: return item.category || "-";
        case 4: return `${item.duration || 0}min`;
        default: return "-";
      }
    case "slots":
      switch (columnIndex) {
        case 1: return item.date || "-";
        case 2: return `${item.start || "-"} - ${item.end || "-"}`;
        case 3: return `${item.capacity || 0}`;
        case 4: return item.status || "-";
        default: return "-";
      }
    case "tasks":
      switch (columnIndex) {
        case 1: return item.title || "-";
        case 2: return item.status || "-";
        case 3: return item.tasktype || "-";
        case 4: return item.assignedto?.substring(0, 8) || "-";
        default: return "-";
      }
    case "transactions":
      switch (columnIndex) {
        case 1: return `${item.amount || 0}`;
        case 2: return item.status || "-";
        case 3: return item.paymethod || "-";
        case 4: return item.createdat ? new Date(item.createdat).toLocaleDateString() : "-";
        default: return "-";
      }
    default:
      return "-";
  }
}

function TableHeader({ entity }: { entity: EntityType }) {
  const headers = ENTITY_COLUMNS[entity];

  return (
    <View style={styles.tableHeader}>
      {headers.map((header) => (
        <Text key={header} style={[styles.headerCell, { flex: 1 }]}>
          {header}
        </Text>
      ))}
    </View>
  );
}

function TableRow({
  item,
  entity,
  index,
}: {
  item: any;
  entity: EntityType;
  index: number;
}) {
  const isEven = index % 2 === 0;
  const headers = ENTITY_COLUMNS[entity];

  return (
    <View style={[styles.tableRow, isEven && styles.tableRowEven]}>
      {headers.map((header, colIndex) => (
        <Text key={`${header}-${colIndex}`} style={[styles.cell, { flex: 1 }]} numberOfLines={1}>
          {getColumnValue(item, entity, colIndex)}
        </Text>
      ))}
    </View>
  );
}

function DataViewer() {
  const insets = useSafeAreaInsets();
  const [selectedEntity, setSelectedEntity] = useState<EntityType>("bookings");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");
  const { items, isLoading, error } = useEntityData(selectedEntity);
  const { performSearch, searchResults, isSearching } = useSemanticSearch();
  const [semanticFilteredItems, setSemanticFilteredItems] = useState<any[]>([]);

  // Keyword search - Filter items based on search query
  const keywordFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      // Search across all string and number fields
      return Object.values(item).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [items, searchQuery]);

  // Semantic search - Perform embeddings-based search
  useEffect(() => {
    if (searchMode === "semantic" && searchQuery.trim()) {
      performSearch(searchQuery, selectedEntity, 10).then(() => {
        // Results are available in searchResults
      });
    } else {
      setSemanticFilteredItems([]);
    }
  }, [searchQuery, selectedEntity, searchMode, performSearch]);

  // Map semantic search results to actual items
  useEffect(() => {
    if (searchResults.length > 0 && searchMode === "semantic") {
      const resultIds = new Set(searchResults.map(r => r.entityId));
      const filtered = items.filter(item => resultIds.has(item.id));
      
      // Sort by semantic search order
      const sorted = searchResults
        .map(result => filtered.find(item => item.id === result.entityId))
        .filter(Boolean);
      
      setSemanticFilteredItems(sorted);
    } else {
      setSemanticFilteredItems([]);
    }
  }, [searchResults, items, searchMode]);

  const filteredItems = searchMode === "semantic" ? semanticFilteredItems : keywordFilteredItems;

  const entities: EntityType[] = [
    "bookings",
    "chat",
    "contributors",
    "conversations",
    "instances",
    "lineitems",
    "memories",
    "nodes",
    "orders",
    "products",
    "reviews",
    "services",
    "slots",
    "tasks",
    "transactions",
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Data Viewer</Text>
      </View>

      {/* Entity Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Select Entity:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buttonGroup}>
          {entities.map((entity) => (
            <Pressable
              key={entity}
              onPress={() => {
                setSelectedEntity(entity);
                setSearchQuery("");
              }}
              style={[
                styles.selectorButton,
                selectedEntity === entity && styles.selectorButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  selectedEntity === entity && styles.selectorButtonTextActive,
                ]}
              >
                {ENTITY_LABELS[entity]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Search Mode Tabs */}
      <View style={styles.searchModeContainer}>
        <Pressable
          style={[styles.searchModeTab, searchMode === "keyword" && styles.searchModeTabActive]}
          onPress={() => setSearchMode("keyword")}
        >
          <Text style={[styles.searchModeTabText, searchMode === "keyword" && styles.searchModeTabTextActive]}>
            Keyword
          </Text>
        </Pressable>
        <Pressable
          style={[styles.searchModeTab, searchMode === "semantic" && styles.searchModeTabActive]}
          onPress={() => setSearchMode("semantic")}
        >
          <Text style={[styles.searchModeTabText, searchMode === "semantic" && styles.searchModeTabTextActive]}>
            Semantic
          </Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchMode === "semantic" ? "Search by meaning..." : "Search across all fields..."}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {(isSearching || (searchQuery.length > 0 && searchMode === "semantic")) && (
          <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
        )}
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        <TableHeader entity={selectedEntity} />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error.message}</Text>
          </View>
        )}

        {!isLoading && !error && items.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        )}

        {!isLoading && !error && filteredItems.length > 0 && (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TableRow item={item} entity={selectedEntity} index={index} />
            )}
            scrollEnabled={false}
          />
        )}

        {!isLoading && !error && items.length > 0 && filteredItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      {!isLoading && !error && items.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {searchQuery ? `Found: ${filteredItems.length} / ${items.length}` : `Total: ${items.length}`} {ENTITY_LABELS[selectedEntity].toLowerCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  selectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  searchModeContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    gap: 8,
  },
  searchModeTab: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  searchModeTabActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  searchModeTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  searchModeTabTextActive: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    color: "#000",
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  clearButtonText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },
  buttonGroup: {
    flexDirection: "row",
  },
  selectorButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  selectorButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  selectorButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  selectorButtonTextActive: {
    color: "#fff",
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#d9d9d9",
    backgroundColor: "#fafafa",
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tableRowEven: {
    backgroundColor: "#f9f9f9",
  },
  cell: {
    fontSize: 12,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#d32f2f",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
});

function App() {
  return (
    <SafeAreaProvider>
      <DataViewer />
    </SafeAreaProvider>
  );
}

export default App;
