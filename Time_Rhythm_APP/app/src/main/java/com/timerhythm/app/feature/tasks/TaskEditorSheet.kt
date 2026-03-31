package com.timerhythm.app.feature.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.timerhythm.app.core.model.TaskDraft

private val taskColors = listOf(
    "#A8B5A2",
    "#C4A59D",
    "#9BAFC4",
    "#C4B89D",
    "#9DC4C0",
)

@Composable
fun TaskEditorSheet(
    draft: TaskDraft,
    onDraftChanged: ((TaskDraft) -> TaskDraft) -> Unit,
    onSubmit: () -> Unit,
) {
    Column(
        modifier = Modifier.padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("新建任务", style = MaterialTheme.typography.titleLarge)

        OutlinedTextField(
            value = draft.title,
            onValueChange = { value -> onDraftChanged { it.copy(title = value) } },
            label = { Text("任务名称") },
            modifier = Modifier.fillMaxWidth(),
        )

        OutlinedTextField(
            value = draft.selectedDate,
            onValueChange = { value -> onDraftChanged { it.copy(selectedDate = value) } },
            label = { Text("日期 YYYY-MM-DD") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(
                value = draft.startTimeText,
                onValueChange = { value -> onDraftChanged { it.copy(startTimeText = value) } },
                label = { Text("开始时间 HH:mm") },
                modifier = Modifier.weight(1f),
                singleLine = true,
            )
            OutlinedTextField(
                value = draft.durationMinutes,
                onValueChange = { value -> onDraftChanged { it.copy(durationMinutes = value) } },
                label = { Text("分钟") },
                modifier = Modifier.weight(1f),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            )
        }

        Text("能量消耗 ${draft.energyLevel}/5")
        Slider(
            value = draft.energyLevel.toFloat(),
            onValueChange = { value -> onDraftChanged { it.copy(energyLevel = value.toInt().coerceIn(1, 5)) } },
            valueRange = 1f..5f,
            steps = 2,
        )

        Text("颜色")
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            taskColors.forEach { hex ->
                Button(
                    onClick = { onDraftChanged { it.copy(color = hex) } },
                    modifier = Modifier.weight(1f),
                ) {
                    Text(if (draft.color == hex) "已选" else "")
                }
            }
        }

        Text(
            text = "当前颜色 ${draft.color}",
            color = runCatching { Color(android.graphics.Color.parseColor(draft.color)) }.getOrElse { Color.Gray },
        )

        Button(onClick = onSubmit, modifier = Modifier.fillMaxWidth()) {
            Text("保存任务")
        }
    }
}