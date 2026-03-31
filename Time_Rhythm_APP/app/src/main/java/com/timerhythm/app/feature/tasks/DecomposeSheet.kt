package com.timerhythm.app.feature.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun DecomposeSheet(
    state: TasksUiState,
    onHintChanged: (String) -> Unit,
    onGenerate: () -> Unit,
    onConfirm: () -> Unit,
) {
    Column(
        modifier = Modifier.padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("AI 任务拆解", style = MaterialTheme.typography.titleLarge)
        Text(state.decomposeTarget?.title ?: "")

        OutlinedTextField(
            value = state.decomposeHint,
            onValueChange = onHintChanged,
            label = { Text("补充说明，可选") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = onGenerate, enabled = !state.isDecomposing, modifier = Modifier.weight(1f)) {
                Text(if (state.isDecomposing) "生成中" else "生成建议")
            }
            Button(
                onClick = onConfirm,
                enabled = state.suggestions.isNotEmpty() && !state.isApplyingSuggestions,
                modifier = Modifier.weight(1f),
            ) {
                Text(if (state.isApplyingSuggestions) "创建中" else "确认创建")
            }
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.suggestions) { suggestion ->
                androidx.compose.material3.Surface {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(suggestion.title, style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "${suggestion.durationMinutes} 分钟 · 能量 ${suggestion.energyLevel}/5 · ${suggestion.color}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }
}