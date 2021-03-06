import { connect } from 'dva';
import {
    Table, Card, message, Button, DatePicker, Form,  Row, Col
} from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import ReactHTMLTableToExcel from 'react-html-table-to-excel';
import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import { formatRangeDate } from '../../../utils/utils';

const { RangePicker } = DatePicker;

// 编辑修改子框
const EditableContext = React.createContext();
const EditableRow = ({ form, index, ...props }) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
    state = {
        editing: false,
    };

    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({ editing }, () => {
            if (editing) {
                this.input.focus();
            }
        });
    };

    save = e => {
        const { record, handleSave } = this.props;
        this.form.validateFields((error, values) => {
            if (error && error[e.currentTarget.id]) {
                return;
            }
            this.toggleEdit();
            // console.log(values, { ...record, ...values })
            handleSave({ ...record, ...values });
        });
    };

    renderCell = form => {
        this.form = form;
        // console.log(this.state)
        // console.log(this.props)
        const { children, dataIndex, record, title } = this.props;
        const { editing } = this.state;
        // console.log(children)
        if (editing) {
            if (dataIndex == "finState") {
                return (
                    <Form.Item style={{ margin: 0 }}>
                        {form.getFieldDecorator(dataIndex, {
                            initialValue: record[dataIndex],
                        })(<Select
                            optionFilterProp="children"
                            onBlur={this.save}
                            filterOption={(input, option) =>
                                option.props.children.indexOf(input) >= 0
                            }
                            ref={node => (this.input = node)}
                        >
                            <Option value="带班">带班</Option>
                            <Option value="线路一">线路一</Option>
                            <Option value="线路二">线路二</Option>
                        </Select>)}
                    </Form.Item>
                )
            }
        }
        else {
            return (
                <div
                    className="editable-cell-value-wrap"
                    style={{ paddingRight: 24 }}
                    onClick={this.toggleEdit}
                >
                    {children}
                </div>
            )
        }
    };

    render() {
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            children,
            ...restProps
        } = this.props;
        // console.log(editable)
        return (
            <td {...restProps}>
                {editable ? (
                    <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
                ) : (
                        children
                    )}
            </td>
        );
    }
}

//-------------------
@connect(({ finance, loading }) => ({
    finance,
    loading: loading.effects['finance/query'],
}))
class EditableTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSource: [],
            count: 0,
            searchText: '',
            searchedColumn: '',
            selectedRowKeys: [],
        };

        this.columns = [
            {
                title: '财政单号',
                dataIndex: 'finName',
                key: 'finName',
                editable: false,
            },
            {
                title: '报单状态',
                dataIndex: 'finState',
                key: 'finState',
                editable: true,
            },
            {
                title: '提交时间',
                dataIndex: 'submitTime',
                key: 'submitTime',
                editable: false,
            },
            {
                title: '报单总额',
                dataIndex: 'finFee',
                editable: false,
            },
        ];
        this.tableRef = React.createRef();
    }
    componentDidMount() {
        const { dispatch } = this.props;
        dispatch({
            type: 'finance/queryFinance',
            callback: (inst, count) => this.setState({ dataSource: inst, count: inst.length }),
        });
        const table = this.tableRef.current.querySelector('table');
        table.setAttribute('id', 'table-to-xls');
    }

    handleSave = row => {
        const newData = [...this.state.dataSource];
        console.log(newData)
        console.log(row)
        const index = newData.findIndex(item => row.financeId === item.financeId);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        // console.log(newData[index])
        const { dispatch } = this.props;
        if (dispatch) {
            dispatch({
                type: 'finance/updateState',
                payload: newData[index],
                callback: response => {
                    if (response == true) {
                        message.success("更新信息成功!");
                        this.setState({ dataSource: newData });
                    }
                    else {
                        message.error("更新失败:<!");
                    }
                }
            })
        }
    }

    
    handleFormReset = () => {
        const { form, dispatch } = this.props;
        form.resetFields();
        this.setState({
            formValues: {},
        });
        dispatch({
            type: 'finance/queryFinance',
            callback: (inst, count) => this.setState({ dataSource: inst, count: inst.length }),
        });
    };
    handleFormSearch = e => {
        e.preventDefault();
        let data = [];

        const { dispatch, form } = this.props;

        form.validateFields((err, fieldsValue) => {
            if (err) return;
            console.log(fieldsValue)
            const { beginDate = '', endDate = '' } = formatRangeDate(fieldsValue.rangeDate);
            // console.log(beginDate)
            const values = {
                ...fieldsValue,
                beginDate,
                endDate,
            };
            delete values.rangeDate;
            this.setState({
                formValues: values,
            });
            console.log(values.beginDate)

            dispatch({
                type: 'finance/queryByDate',
                payload: { values },
                callback: (inst, count) => this.setState({ dataSource: inst, count: inst.length }),
            });

        });
    };
    //查询
    renderSimpleForm() {
        const {
            form: { getFieldDecorator },
        } = this.props;
        return (
            <Form onSubmit={this.handleFormSearch} layout="inline">
                <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
                    <Col md={12} sm={24}>
                        <Form.Item label="添加时间">
                            {getFieldDecorator('rangeDate')(<DatePicker.RangePicker />)}
                        </Form.Item>
                    </Col>
                    <Col md={6} sm={24}>
                        <span >
                            <Button type="primary" htmlType="submit">
                                查询
                            </Button>
                            <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                                重置
                            </Button>
                        </span>
                    </Col>
                </Row>
            </Form>
        );
    }

    render() {
        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell,
            },
        };
        // console.log(components)
        const columns = this.columns.map(col => {
            // console.log(col.editable)
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });

        return (
            <PageHeaderWrapper>
                {/* <Button onClick={(flag) => this.updateState("wait")} type="primary" style={{ marginBottom: 16 }} disabled={!hasSelected} shape="circle" >带班</Button>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <Button onClick={(flag) => this.updateState("one")} type="primary" style={{ marginBottom: 16 }} disabled={!hasSelected} shape="circle" >线路一</Button>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <Button onClick={(flag) => this.updateState("two")} type="primary" style={{ marginBottom: 16 }} disabled={!hasSelected} shape="circle" >线路二</Button> */}

                <Card>
                    <div >
                        {this.renderSimpleForm()}

                        <ReactHTMLTableToExcel
                            id="test-table-xls-button"
                            className="download-table-xls-button"
                            table="table-to-xls"
                            filename="tablexls"
                            sheet="tablexls"
                            buttonText="导出"
                        />
                        {/* react无法获取自定义组件节点,所以这里要包一层 */}
                        <div ref={this.tableRef}>
                            <Table
                                rowKey={record => record.financeId - 1}
                                components={components}
                                dataSource={this.state.dataSource}
                                columns={columns}
                                rowClassName={() => 'editable-row'}
                            />
                        </div>

                    </div>
                </Card>
            </PageHeaderWrapper>
        );
    }
}
const EditableFormTable = Form.create()(EditableTable);
export default EditableFormTable;
